import { unstable_batchedUpdates as batchUpdates } from 'react-dom';
import create from 'zustand';
import produce, { setAutoFreeze } from 'immer';
import { BigIntOrderedMap, decToUd, unixToDa } from '@urbit/api';
import { Poke } from '@urbit/http-api';
import { BigInteger } from 'big-integer';
import { useCallback, useMemo } from 'react';
import {
  Chat,
  ChatBriefs,
  ChatBriefUpdate,
  ChatDiff,
  ChatDraft,
  ChatPerm,
  ChatWrit,
  ClubAction,
  ClubDelta,
  DmAction,
  WritDelta,
} from '../../types/chat';
import api from '../../api';
import { whomIsDm } from '../../logic/utils';
import makeWritsStore from './writs';
import { ChatState } from './type';

setAutoFreeze(false);

function chatAction(whom: string, diff: ChatDiff) {
  return {
    app: 'chat',
    mark: 'chat-action',
    json: {
      flag: whom,
      update: {
        time: '',
        diff,
      },
    },
  };
}

function chatWritDiff(whom: string, id: string, delta: WritDelta) {
  return chatAction(whom, {
    writs: {
      id,
      delta,
    },
  });
}

function makeId() {
  return `${window.our}/${decToUd(unixToDa(Date.now()).toString())}`;
}

function dmAction(
  ship: string,
  delta: WritDelta,
  id = makeId()
): Poke<DmAction> {
  return {
    app: 'chat',
    mark: 'dm-action',
    json: {
      ship,
      diff: {
        id,
        delta,
      },
    },
  };
}

function multiDmAction(id: string, delta: ClubDelta): Poke<ClubAction> {
  return {
    app: 'chat',
    mark: 'club-action',
    json: {
      id,
      diff: {
        echo: 0,
        delta,
      },
    },
  };
}

export const useChatState = create<ChatState>((set, get) => ({
  set: (fn) => {
    set(produce(get(), fn));
  },
  batchSet: (fn) => {
    batchUpdates(() => {
      get().set(fn);
    });
  },
  chats: {},
  dmArchive: [],
  pacts: {},
  dms: {},
  drafts: {},
  dmSubs: [],
  multiDms: {},
  multiDmSubs: [],
  pendingDms: [],
  pinnedDms: [],
  briefs: {},
  pinDm: async (ship) => {
    await api.poke({
      app: 'chat',
      mark: 'dm-pin',
      json: {
        ship,
        pin: true,
      },
    });
    get().set((draft) => {
      draft.pinnedDms = [...draft.pinnedDms, ship];
    });
  },
  unpinDm: async (ship) => {
    await api.poke({
      app: 'chat',
      mark: 'dm-pin',
      json: {
        ship,
        pin: false,
      },
    });
    get().set((draft) => {
      draft.pinnedDms = draft.pinnedDms.filter((s) => s !== ship);
    });
  },
  markRead: async (whom) => {
    await api.poke({
      app: 'chat',
      mark: 'chat-remark-action',
      json: {
        whom,
        diff: { read: null },
      },
    });
  },
  start: async () => {
    // TODO: parallelise
    const briefs = await api.scry<ChatBriefs>({
      app: 'chat',
      path: '/briefs',
    });

    get().batchSet((draft) => {
      draft.briefs = briefs;
    });

    const pendingDms = await api.scry<string[]>({
      app: 'chat',
      path: '/dm/invited',
    });
    get().batchSet((draft) => {
      draft.pendingDms = pendingDms;
    });

    try {
      const pinnedDms = await api.scry<string[]>({
        app: 'chat',
        path: '/dm/pinned',
      });
      get().batchSet((draft) => {
        draft.pinnedDms = pinnedDms;
      });
    } catch (error) {
      console.log(error);
    }

    api.subscribe({
      app: 'chat',
      path: '/briefs',
      event: (event: unknown) => {
        const { whom, brief } = event as ChatBriefUpdate;
        get().batchSet((draft) => {
          draft.briefs[whom] = brief;
        });
      },
    });
    api.subscribe({
      app: 'chat',
      path: '/dm/invited',
      event: (event: unknown) => {
        get().batchSet((draft) => {
          draft.pendingDms = event as string[];
        });
      },
    });
  },
  fetchOlder: async (whom: string, count: string) => {
    const isDM = whomIsDm(whom);
    if (isDM) {
      return makeWritsStore(
        whom,
        get,
        `/dm/${whom}/writs`,
        `/dm/${whom}/ui`
      ).getOlder(count);
    }
    return makeWritsStore(
      whom,
      get,
      `/chat/${whom}/writs`,
      `/chat/${whom}/ui/writs`
    ).getOlder(count);
  },
  fetchDms: async () => {
    const dms = await api.scry<string[]>({
      app: 'chat',
      path: '/dm',
    });
    get().batchSet((draft) => {
      dms.forEach((ship) => {
        const chat = {
          writs: new BigIntOrderedMap<ChatWrit>(),
          perms: {
            writers: [],
          },
          draft: {
            inline: [],
            block: [],
          },
        };
        draft.dms[ship] = chat;
      });
    });
    const archive = await api.scry<string[]>({
      app: 'chat',
      path: '/dm/archive',
    });
    get().batchSet((draft) => {
      draft.dmArchive = archive;
    });
  },
  unarchiveDm: async (ship) => {
    await api.poke({
      app: 'chat',
      mark: 'dm-unarchive',
      json: ship,
    });
  },
  archiveDm: async (ship) => {
    await api.poke({
      app: 'chat',
      mark: 'dm-archive',
      json: ship,
    });
    get().batchSet((draft) => {
      delete draft.pacts[ship];
      delete draft.dms[ship];
      delete draft.briefs[ship];
    });
  },
  joinChat: async (flag) => {
    await api.poke({
      app: 'chat',
      mark: 'flag',
      json: flag,
    });
  },
  dmRsvp: async (ship, ok) => {
    get().batchSet((draft) => {
      draft.pendingDms = draft.pendingDms.filter((d) => d !== ship);
      if (!ok) {
        delete draft.pacts[ship];
        delete draft.dms[ship];
        delete draft.briefs[ship];
      }
    });

    await api.poke({
      app: 'chat',
      mark: 'dm-rsvp',
      json: {
        ship,
        ok,
      },
    });
  },
  sendMessage: (whom, memo) => {
    const isDM = whomIsDm(whom);
    const diff = { add: memo };
    if (isDM) {
      api.poke(dmAction(whom, { add: memo }));
    } else {
      const id = makeId();
      console.log(id, memo);
      api.poke(chatWritDiff(whom, id, diff));
    }
  },
  delMessage: (whom, id) => {
    const isDM = whomIsDm(whom);
    const diff = { del: null };
    if (isDM) {
      api.poke(dmAction(whom, diff, id));
    } else {
      api.poke(chatWritDiff(whom, id, diff));
    }
  },
  create: async (req) => {
    await api.poke({
      app: 'chat',
      mark: 'chat-create',
      json: req,
    });
  },
  createMultiDm: async (id, hive) => {
    await api.poke({
      app: 'chat',
      mark: 'club-create',
      json: {
        id,
        hive,
      },
    });
    get().batchSet((draft) => {
      draft.multiDms[id] = {
        hive,
        team: [],
        meta: {
          title: hive.sort().join(', '),
          description: '',
          image: '',
        },
      };
    });
  },
  editMultiDm: async (id, meta) => {
    await api.poke(multiDmAction(id, { meta }));
  },
  inviteToMultiDm: async (id, hive) => {
    await api.poke(multiDmAction(id, { hive: { ...hive, add: true } }));
  },
  removeFromMultiDm: async (id, hive) => {
    await api.poke(multiDmAction(id, { hive: { ...hive, add: false } }));
  },
  sendMultiDm: async (id, chatId, memo) => {
    await api.poke(
      multiDmAction(id, {
        writ: {
          id: chatId,
          delta: { add: { ...memo, sent: Date.now() } },
        },
      })
    );
  },
  addSects: async (whom, sects) => {
    await api.poke(chatAction(whom, { 'add-sects': sects }));
  },
  initialize: async (whom: string) => {
    if (whom in get().chats) {
      return;
    }

    const perms = await api.scry<ChatPerm>({
      app: 'chat',
      path: `/chat/${whom}/perm`,
    });
    get().batchSet((draft) => {
      const chat = {
        writs: new BigIntOrderedMap<ChatWrit>(),
        perms,
        draft: { block: [], inline: [] },
      };
      draft.chats[whom] = chat;
    });

    await makeWritsStore(
      whom,
      get,
      `/chat/${whom}/writs`,
      `/chat/${whom}/ui/writs`
    ).initialize();
  },
  getDraft: async (whom) => {
    const chatDraft = await api.scry<ChatDraft>({
      app: 'chat',
      path: `/draft/${whom}`,
    });
    set((draft) => {
      draft.drafts[whom] = chatDraft.story;
    });
  },
  draft: async (whom, story) => {
    api.poke({
      app: 'chat',
      mark: 'chat-draft',
      json: {
        whom,
        story,
      },
    });
  },
  initializeDm: async (ship: string) => {
    if (get().dmSubs.includes(ship)) {
      return;
    }
    get().batchSet((draft) => {
      draft.dmSubs.push(ship);
    });
    await makeWritsStore(
      ship,
      get,
      `/dm/${ship}/writs`,
      `/dm/${ship}/ui`
    ).initialize();
  },
  initializeMultiDm: async (id: string) => {
    if (get().multiDmSubs.includes(id)) {
      return;
    }
    get().batchSet((draft) => {
      draft.multiDmSubs.push(id);
    });
    await makeWritsStore(
      id,
      get,
      `/dm/${id}/writs`, // TODO: is this the correct endpoint?
      `/dm/${id}/ui`
    ).initialize();
  },
}));

export function useMessagesForChat(whom: string) {
  const def = useMemo(() => new BigIntOrderedMap<ChatWrit>(), []);
  return useChatState(
    useCallback((s) => s.pacts[whom]?.writs || def, [whom, def])
  );
}

const defaultPerms = {
  writers: [],
};

export function useChatPerms(whom: string) {
  return useChatState(
    useCallback((s) => s.chats[whom]?.perms || defaultPerms, [whom])
  );
}

export function useChatIsJoined(whom: string) {
  return useChatState(
    useCallback((s) => Object.keys(s.briefs).includes(whom), [whom])
  );
}

const selDmList = (s: ChatState) =>
  Object.keys(s.briefs)
    .filter((d) => !d.includes('/') && !s.pendingDms.includes(d))
    .sort((a, b) => (s.briefs[b]?.last || 0) - (s.briefs[a]?.last || 0));

export function useDmList() {
  return useChatState(selDmList);
}

export function useDmMessages(ship: string) {
  return useMessagesForChat(ship);
}

export function useMultiDmMessages(id: string) {
  return useMessagesForChat(id);
}

export function usePact(whom: string) {
  return useChatState(useCallback((s) => s.pacts[whom], [whom]));
}

export function useCurrentPactSize(whom: string) {
  return useChatState(
    useCallback((s) => s.pacts[whom]?.writs.size ?? 0, [whom])
  );
}

export function useReplies(whom: string, id: string) {
  const pact = usePact(whom);
  return useMemo(() => {
    const { writs, index } = pact;
    const time = index[id];
    if (!time) {
      return new BigIntOrderedMap<ChatWrit>();
    }
    const message = writs.get(time);
    const replies = (message?.seal?.replied || ([] as string[]))
      .map((r: string) => {
        const t = pact.index[r];
        const writ = t && writs.get(t);
        return t && writ ? ([t, writ] as const) : undefined;
      })
      .filter((r: unknown): r is [BigInteger, ChatWrit] => !!r);
    return new BigIntOrderedMap<ChatWrit>().gas(replies);
  }, [pact, id]);
}

export function useWrit(whom: string, id: string) {
  return useChatState(
    useCallback(
      (s) => {
        const pact = s.pacts[whom];
        if (!pact) {
          return undefined;
        }
        const time = pact.index[id];
        if (!time) {
          return undefined;
        }
        return [time, pact.writs.get(time)] as const;
      },
      [whom, id]
    )
  );
}

export function useChat(whom: string): Chat | undefined {
  return useChatState(useCallback((s) => s.chats[whom], [whom]));
}

export function useChatDraft(whom: string) {
  return useChatState(
    useCallback(
      (s) =>
        s.drafts[whom] || {
          inline: [],
          block: [],
        },
      [whom]
    )
  );
}

const selPendingDms = (s: ChatState) => s.pendingDms;
export function usePendingDms() {
  return useChatState(selPendingDms);
}

export function useDmIsPending(ship: string) {
  return useChatState(useCallback((s) => s.pendingDms.includes(ship), [ship]));
}

const selDmArchive = (s: ChatState) => s.dmArchive;
export function useDmArchive() {
  return useChatState(selDmArchive);
}

export function isDMBrief(brief: string) {
  return !brief.includes('/');
}

export function isGroupBrief(brief: string) {
  return brief.includes('/');
}

export function useBriefs() {
  return useChatState(useCallback((s: ChatState) => s.briefs, []));
}

export function usePinnedChats() {
  return useChatState(useCallback((s: ChatState) => s.pinnedDms, []));
}

const selMultiDms = (s: ChatState) => s.multiDms;
export function useMultiDms() {
  return useChatState(selMultiDms);
}

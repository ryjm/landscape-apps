import api from '@/api';
import { asyncWithDefault, isTalk } from '@/logic/utils';
import { TalkInit, GroupsInit } from '@/types/ui';
import { useChatState } from './chat';
import useContactState from './contact';
import { useDiaryState } from './diary';
import useDocketState from './docket';
import { useGroupState } from './groups';
import useHarkState from './hark';
import { useHeapState } from './heap/heap';
import useKilnState from './kiln';
import usePalsState from './pals';
import useSchedulerStore from './scheduler';
import { useSettingsState } from './settings';
import { useStorage } from './storage';

const emptyGroupsInit: GroupsInit = {
  groups: {},
  gangs: {},
  chat: { briefs: {}, chats: {}, pins: [] },
  heap: { briefs: {}, stash: {} },
  diary: { briefs: {}, shelf: {} },
};

const emptyTalkInit: TalkInit = {
  groups: {},
  gangs: {},
  briefs: {},
  chats: {},
  clubs: {},
  dms: [],
  invited: [],
  pins: [],
};

export default async function bootstrap(reset = false) {
  const { wait } = useSchedulerStore.getState();
  if (reset) {
    api.reset();
    useChatState.getState().clearSubs();
    useHeapState.getState().clearSubs();
    useDiaryState.getState().clearSubs();
  }

  if (isTalk) {
    // make sure if this errors we don't kill the entire app
    const { groups, gangs, ...chat } = await asyncWithDefault(
      () =>
        api.scry<TalkInit>({
          app: 'talk-ui',
          path: '/init',
        }),
      emptyTalkInit
    );

    useGroupState.getState().start({ groups, gangs });
    useChatState.getState().startTalk(chat);
  } else {
    // make sure if this errors we don't kill the entire app
    const { chat, heap, diary, ...groups } = await asyncWithDefault(
      () =>
        api.scry<GroupsInit>({
          app: 'groups-ui',
          path: '/init',
        }),
      emptyGroupsInit
    );

    useGroupState.getState().start(groups);
    useChatState.getState().start(chat);
    useHeapState.getState().start(heap);
    useDiaryState.getState().start(diary);
  }

  const { initialize: settingsInitialize, fetchAll } =
    useSettingsState.getState();

  wait(() => {
    useHarkState.getState().start();
    useContactState.getState().initialize(api);
    useStorage.getState().initialize(api);

    fetchAll();
  }, 4);

  wait(() => {
    settingsInitialize(api);
    useKilnState.getState().initializeKiln();
    const { start, fetchCharges } = useDocketState.getState();
    fetchCharges();
    start();

    usePalsState.getState().initializePals();
  }, 5);
}

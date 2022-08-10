/* eslint-disable no-console */
import React, { useCallback, useState } from 'react';
import cn from 'classnames';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { useRouteGroup, useGroup, useAmAdmin } from '@/state/groups';
import { GroupChannel, Zone } from '@/types/groups';
import { channelHref, nestToFlag } from '@/logic/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import LeaveIcon from '@/components/icons/LeaveIcon';
import BulletIcon from '@/components/icons/BulletIcon';
import { useBriefs, useChatState } from '@/state/chat';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import CaretDown16Icon from '@/components/icons/CaretDown16Icon';
import PencilIcon from '@/components/icons/PencilIcon';
import useRequestState from '@/logic/useRequestState';
import ChannelIcon from '@/channels/ChannelIcon';
import useChannelSections from '@/logic/useChannelSections';

const UNZONED = 'sectionless';

function GroupChannel({
  channel,
  nest,
}: {
  nest: string;
  channel: GroupChannel;
}) {
  const [_app, flag] = nestToFlag(nest);
  const groupFlag = useRouteGroup();
  const group = useGroup(groupFlag);
  const briefs = useBriefs();
  const isAdmin = useAmAdmin(flag);
  const navigate = useNavigate();
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(
    null
  );
  const { isFailed, isPending, isReady, setFailed, setPending, setReady } =
    useRequestState();

  const editChannel = useCallback(() => {
    navigate(`/groups/${flag}/info/channels`);
  }, [flag, navigate]);

  const joinChannel = useCallback(async () => {
    try {
      if (timer) {
        clearTimeout(timer);
        setTimer(null);
      }
      setPending();
      await useChatState.getState().joinChat(flag);
      setReady();
    } catch (error) {
      if (error) {
        console.error(`[ChannelIndex:JoinError] ${error}`);
      }
      setFailed();
      setTimer(
        setTimeout(() => {
          setReady();
          setTimer(null);
        }, 10 * 1000)
      );
    }
  }, [flag, setFailed, setPending, setReady, timer]);

  const leaveChannel = useCallback(async () => {
    try {
      await useChatState.getState().leaveChat(flag);
    } catch (error) {
      if (error) {
        console.error(`[ChannelIndex:LeaveError] ${error}`);
      }
    }
  }, [flag]);

  const muteChannel = useCallback(() => {
    // TODO: what happens on Mute?
    console.log('mute ...');
  }, []);

  // If the current user is the Channel host, they are automatically joined,
  // and cannot leave the group
  const isChannelHost = window.our === flag?.split('/')[0];

  // A Channel is considered Joined if hosted by current user, or if a Brief
  // exists
  const joined = isChannelHost || (flag && flag in briefs);

  const open = useCallback(() => {
    if (!joined) {
      return;
    }
    navigate(channelHref(groupFlag, nest));
  }, [groupFlag, joined, navigate, nest]);

  if (!group) {
    return null;
  }

  return (
    <li className="my-2 flex flex-row items-center justify-between rounded-lg pl-0 pr-2 hover:bg-gray-50">
      <button
        className="flex w-full items-center justify-start rounded-xl p-2 text-left hover:bg-gray-50"
        onClick={open}
      >
        <div className="flex flex-row">
          <div className="mr-3 flex h-12 w-12 items-center justify-center rounded bg-gray-50">
            <ChannelIcon nest={nest} className="h-6 w-6 text-gray-400" />
          </div>
          <div className="flex flex-col justify-evenly">
            {joined && nest ? (
              <Link
                className="font-semibold text-gray-800"
                to={channelHref(groupFlag, nest)}
              >
                {channel.meta.title}
              </Link>
            ) : (
              <div className="font-semibold text-gray-800">
                {channel.meta.title}
              </div>
            )}
          </div>
        </div>
      </button>
      <div>
        {joined ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild className="appearance-none">
              <button className="button bg-green-soft text-green mix-blend-multiply dark:bg-green-900 dark:mix-blend-screen hover:dark:bg-green-800">
                <span className="mr-1">Joined</span>{' '}
                <CaretDown16Icon className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content className="dropdown">
              <DropdownMenu.Item
                onSelect={muteChannel}
                className="dropdown-item flex items-center space-x-2"
              >
                <BulletIcon className="h-6 w-6 text-gray-400" />
                <span className="text-gray-800">Mute Channel</span>
              </DropdownMenu.Item>
              {isAdmin ? (
                <DropdownMenu.Item
                  onSelect={editChannel}
                  className="dropdown-item flex items-center space-x-2"
                >
                  <PencilIcon className="m-1.5 h-3 w-3 fill-gray-500" />
                  <span>Edit Channel</span>
                </DropdownMenu.Item>
              ) : null}
              {!isChannelHost ? (
                <DropdownMenu.Item
                  onSelect={leaveChannel}
                  className="dropdown-item flex items-center space-x-2 text-red hover:bg-red-soft hover:dark:bg-red-900"
                >
                  <LeaveIcon className="h-6 w-6" />
                  <span>Leave Channel</span>
                </DropdownMenu.Item>
              ) : null}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        ) : (
          <button
            disabled={isPending}
            onClick={joinChannel}
            className={cn(
              'button mix-blend-multiply disabled:bg-gray-50 dark:mix-blend-screen',
              {
                'bg-gray-50': isReady || isPending,
                'bg-red-soft': isFailed,
                'text-gray-800': isReady,
                'text-gray-400': isPending,
                'text-red': isFailed,
              }
            )}
          >
            {isPending ? (
              <span className="center-items flex">
                <LoadingSpinner />
                <span className="ml-2">Joining...</span>
              </span>
            ) : isFailed ? (
              'Retry'
            ) : (
              'Join'
            )}
          </button>
        )}
      </div>
    </li>
  );
}

function ChannelSection({
  channels,
  zone,
}: {
  channels: [string, GroupChannel][];
  zone: Zone | null;
}) {
  const flag = useRouteGroup();
  const group = useGroup(flag);
  const sectionTitle =
    zone && group?.zones && zone in group.zones
      ? group.zones[zone].meta.title
      : '';
  const sortedChannels = channels.slice();
  sortedChannels.sort(([, a], [, b]) =>
    a.meta.title.localeCompare(b.meta.title)
  );

  return (
    <>
      {zone !== UNZONED ? (
        <div className="py-4 font-semibold text-gray-400">{sectionTitle}</div>
      ) : null}
      <ul>
        {sortedChannels.map(([nest, channel]) => (
          <GroupChannel nest={nest} channel={channel} key={channel.added} />
        ))}
      </ul>
    </>
  );
}

export default function ChannelIndex() {
  const flag = useRouteGroup();
  const { sectionedChannels, sections } = useChannelSections(flag);
  const navigate = useNavigate();
  const isAdmin = useAmAdmin(flag);

  return (
    <section className="w-full p-4">
      <div className="mb-4 flex flex-row justify-between">
        <h1 className="text-lg font-bold">All Channels</h1>
        {isAdmin ? (
          <button
            onClick={() => navigate(`/groups/${flag}/info/channels`)}
            className="rounded-md bg-gray-800 py-1 px-2 text-[12px] font-semibold leading-4 text-white"
          >
            Channel Settings
          </button>
        ) : null}
      </div>
      {sections.map((section) => (
        <div
          key={section}
          className="mb-2 w-full rounded-xl bg-white py-1 pl-4 pr-2"
        >
          <ChannelSection
            channels={
              section in sectionedChannels ? sectionedChannels[section] : []
            }
            zone={section}
          />
        </div>
      ))}
    </section>
  );
}

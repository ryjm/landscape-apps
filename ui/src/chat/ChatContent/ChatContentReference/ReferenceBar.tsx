import React, { useCallback } from 'react';
import cn from 'classnames';
import { useChannel, useGroup } from '@/state/groups';
import Author from '@/chat/ChatMessage/Author';
import { useNavigate } from 'react-router';
import { daToUnix } from '@urbit/api';
import { BigInteger } from 'big-integer';
import ChannelIcon from '@/channels/ChannelIcon';

export default function ReferenceBar({
  groupFlag,
  nest,
  time,
  author,
  top = false,
}: {
  groupFlag: string;
  nest: string;
  time: BigInteger;
  author?: string;
  top?: boolean;
}) {
  const navigate = useNavigate();
  const channel = useChannel(groupFlag, nest);
  const group = useGroup(groupFlag);
  const unix = new Date(daToUnix(time));

  const navigateToChannel = useCallback(() => {
    navigate(`/groups/${groupFlag}/channels/${nest}`);
  }, [navigate, nest, groupFlag]);

  return (
    <div
      className={cn(
        'flex items-center justify-between border-gray-50 p-2 group-hover:bg-gray-50',
        {
          'border-t-2': !top,
        }
      )}
    >
      {author ? <Author ship={author} date={unix} hideTime /> : null}
      {top ? null : (
        <div
          onClick={navigateToChannel}
          className="flex cursor-pointer items-center space-x-2 text-gray-400 group-hover:text-gray-600"
        >
          <ChannelIcon nest={nest} className="-mr-1 h-4 w-4" />
          <span className="font-semibold">{channel?.meta.title}</span>
          <span className="font-bold">•</span>
          <span className="font-semibold">{group?.meta.title}</span>
        </div>
      )}
    </div>
  );
}

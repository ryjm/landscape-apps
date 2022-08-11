import React, { useMemo } from 'react';
import { useGroup, useRouteGroup } from '@/state/groups';
import { SectionMap } from './types';
import AdminChannelListDropContext from './AdminChannelListDropContext';

const UNZONED = '';

export default function AdminChannelList() {
  const flag = useRouteGroup();
  const group = useGroup(flag);

  const getSectionedChannels = useMemo(() => {
    const sectionedChannels: SectionMap = {
      [UNZONED]: {
        title: 'Sectionless',
        channels: [],
      },
    };

    if (group) {
      group['zone-ord'].forEach((zone) => {
        sectionedChannels[zone] = {
          title: group.zones[zone].meta.title,
          channels: [],
        };
      });

      Object.entries(group.zones).forEach(([key, zone]) => {
        const orderedChannels = (zone.idx || []).map((idx) => ({
          key: idx,
          channel: group.channels[idx],
        }));
        sectionedChannels[key].channels = orderedChannels.filter(
          (channelItem) => channelItem.channel.zone === key
        );
      });
    }

    return sectionedChannels;
  }, [group]);

  return (
    <AdminChannelListDropContext sectionedChannels={getSectionedChannels} />
  );
}

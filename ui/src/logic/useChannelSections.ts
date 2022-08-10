import { useGroup } from '@/state/groups';
import { groupBy } from 'lodash';

export default function useChannelSections(groupFlag: string) {
  const group = useGroup(groupFlag);

  if (!group) {
    return {
      sections: [],
      sectionedChannels: {},
    };
  }

  const sections = [...group['zone-ord']];
  const sectionedChannels = groupBy(
    Object.entries(group.channels),
    ([, ch]) => ch.zone
  );
  // unsectioned channels have zone 'null' after groupBy; replace with empty str
  if ('null' in sectionedChannels) {
    sectionedChannels.sectionless = sectionedChannels.null;
    delete sectionedChannels.null;
  }

  return {
    sectionedChannels,
    sections,
  };
}

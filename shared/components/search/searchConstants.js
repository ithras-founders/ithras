/** @type {{ id: string, label: string }[]} */
export const SEARCH_MODE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'people', label: 'People' },
  { id: 'posts', label: 'Posts' },
  { id: 'communities', label: 'Communities' },
  { id: 'channels', label: 'Channels' },
  { id: 'organizations', label: 'Organizations' },
  { id: 'institutions', label: 'Institutions' },
];

/**
 * Preset filters per mode (advanced panel).
 * @type {Record<string, Array<{ key: string, label: string, placeholder?: string, hint?: string }>>}
 */
export const FILTER_PRESETS = {
  people: [
    {
      key: 'company',
      label: 'Company',
      hint: 'Matches organisation names on the member’s experience.',
    },
    {
      key: 'institution',
      label: 'Institution',
      hint: 'Matches school / university on their education.',
    },
    {
      key: 'function',
      label: 'Function',
      hint: 'Matches role or function on experience.',
    },
    {
      key: 'year',
      label: 'Grad year',
      placeholder: 'e.g. 2024',
      hint: 'Graduation or class year.',
    },
    {
      key: 'major',
      label: 'Major',
      hint: 'Field of study on education.',
    },
  ],
  posts: [
    {
      key: 'community',
      label: 'Community',
      placeholder: 'Community name contains…',
      hint: 'Narrows posts to communities whose name matches.',
    },
  ],
  communities: [
    {
      key: 'type',
      label: 'Type',
      placeholder: 'institution | organisation | public | function',
      hint: 'Filter by how the community is scoped.',
    },
    {
      key: 'institution',
      label: 'Institution',
      hint: 'When the community is tied to a school, match institution name.',
    },
  ],
};

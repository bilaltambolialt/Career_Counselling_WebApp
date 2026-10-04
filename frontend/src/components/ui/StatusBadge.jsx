/**
 * Props:
 *   active — boolean
 *   activeLabel   — string (default "Active")
 *   inactiveLabel — string (default "Inactive")
 */
const StatusBadge = ({
  active,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      active
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'bg-red-50 text-red-600 ring-1 ring-red-200'
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-red-400'}`}
    />
    {active ? activeLabel : inactiveLabel}
  </span>
);

export default StatusBadge;

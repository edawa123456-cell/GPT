import TrackingControl from './tracking-control';

export const metadata = {
  title: 'Testing preferences | TowTruckOnDemand',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <TrackingControl />;
}

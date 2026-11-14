import LocationShare from './LocationShare';

export const metadata = {
  title: 'Share Pickup Location | TowTruckOnDemand',
  description: 'Share your pickup pin with your towing dispatcher by text message.',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function LocatePage() {
  return <LocationShare />;
}

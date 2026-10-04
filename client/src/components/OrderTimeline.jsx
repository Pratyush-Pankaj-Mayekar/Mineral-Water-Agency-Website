import { Check, Package, PackageCheck, Truck, XCircle } from 'lucide-react';

const flow = [
  { status: 'PLACED', label: 'Order placed', detail: 'We have received your order.', icon: Package },
  { status: 'CONFIRMED', label: 'Confirmed', detail: 'Your order is being prepared.', icon: Check },
  { status: 'PACKED', label: 'Packed with care', detail: 'Your water is ready to go.', icon: PackageCheck },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', detail: 'On its way to your doorstep.', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', detail: 'Enjoy your Pure Aqua.', icon: Check },
];
export default function OrderTimeline({ status }) {
  const currentIndex = flow.findIndex((step) => step.status === status);
  if (status === 'CANCELLED') return <div className="cancelled-timeline"><XCircle size={20} /><div><strong>Order cancelled</strong><span>This order will not be delivered.</span></div></div>;
  return <div className="order-timeline">{flow.map((step, index) => {
    const Icon = step.icon;
    const completed = index <= currentIndex;
    const current = index === currentIndex;
    return <div className={`timeline-step ${completed ? 'completed' : ''} ${current ? 'current' : ''}`} key={step.status}>
      <div className="timeline-rail"><span className="timeline-node"><Icon size={15} /></span>{index < flow.length - 1 && <span className="timeline-connector" />}</div>
      <div className="timeline-copy"><strong>{step.label}</strong><span>{current ? step.detail : completed ? (index < currentIndex ? 'Complete' : step.detail) : 'Up next'}</span></div>
    </div>;
  })}</div>;
}

import dynamic from "next/dynamic";
const NpsDashboard = dynamic(() => import("./NpsDashboard"), { ssr: false });

export default function Page() {
  return <NpsDashboard />;
} 
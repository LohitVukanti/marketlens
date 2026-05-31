import FeedClient from "@/app/feed/FeedClient";
import { getFeedSignals } from "@/lib/signal-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function FeedPage() {
  const { signals, source } = await getFeedSignals();

  return <FeedClient signals={signals} dataSource={source} />;
}

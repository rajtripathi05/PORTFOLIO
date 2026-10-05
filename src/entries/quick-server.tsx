// Server entry used only at build time to pre-render Quick View to static HTML.
import { renderToString } from "react-dom/server";
import QuickView from "~/pages/QuickView";

export const render = (): string => renderToString(<QuickView />);

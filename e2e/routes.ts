// Every page a reader can open in this course. The audit visits each at 1280 px and 375 px wide.
export type Route = { name: string; path: string };

export const routes: Route[] = [{ name: "office report", path: "/office-report.html" }];

// Button verbs this course uses beyond the shared list, in lower case.
export const extraButtonVerbs: string[] = [];

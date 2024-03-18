import dynamic from "next/dynamic";

const NoSSRWrapper = (props: { children: React.ReactNode }): JSX.Element => (
  <>{props.children}</>
);
export default dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
});

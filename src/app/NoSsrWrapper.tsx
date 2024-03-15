import dynamic from "next/dynamic";

const NoSSRWrapper = (props: {
  children: React.ReactNode;
}): React.ReactElement => <>{props.children}</>;

export default dynamic(() => Promise.resolve(NoSSRWrapper), {
  ssr: false,
});

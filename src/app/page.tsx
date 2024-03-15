import Home from "./Home";
import NoSsrWrapper from "./NoSsrWrapper";

export default function Page() {
  return (
    <div className="flex justify-center text-center">
      <NoSsrWrapper>
        <Home />
      </NoSsrWrapper>
    </div>
  );
}

import { IoIosDownload } from "react-icons/io";

const OutputVideo = ({ handleDownload, videoSrc }: any) => {
  return videoSrc ? (
    <div className="flex flex-col">
      <video
        className="grid justify-center items-start mt-5 rounded-lg"
        src={videoSrc}
        autoPlay
        controls
        muted
      />
      <button
        className="flex justify-center items-center w-full text-white text-xl gap-2 font-medium bg-green-500 mt-4 rounded-md p-2 "
        onClick={handleDownload}
      >
        <IoIosDownload />
        Download
      </button>
    </div>
  ) : null;
};

export default OutputVideo;

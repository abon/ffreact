const OutputVideo = ({ handleDownload, videoSrc }: any) => {
  return videoSrc ? (
    <div className="flex flex-col">
      <div className="w-7/12">
        <video src={videoSrc} autoPlay controls muted />
        <button onClick={handleDownload} className="btn bg-orange-500 p-2">
          {" "}
          Download
        </button>
      </div>
    </div>
  ) : null;
};

export default OutputVideo;

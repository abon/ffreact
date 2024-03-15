function VideoFilePicker({
  showVideo,
  handleChange,
  children,
}: {
  showVideo: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}): JSX.Element {
  const FileInput = () => (
    <label
      htmlFor="picker"
      id={`${showVideo ? "file_picker_small" : ""}`}
      className={`file_picker `}
    >
      <input
        onChange={handleChange}
        type="file"
        id="picker"
        accept="video/mp4"
      />
    </label>
  );

  return showVideo ? (
    <div className="w-7/12">
      {children} <FileInput />
    </div>
  ) : (
    <FileInput />
  );
}

export default VideoFilePicker;

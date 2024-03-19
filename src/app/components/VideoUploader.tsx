"use client";

import { FileInput, FileInputProps } from "@mantine/core";

interface VideoUploaderProps {
  onChange?: (file: File | null) => void;
  isVideoUploaded?: boolean;
  children?: React.ReactNode;
  meta?: { [key: string]: any };
}

const VideoUploader = ({
  onChange,
  isVideoUploaded,
  children,
  meta,
}: VideoUploaderProps) => {
  return (
    <>
      <FileInput
        radius="md"
        label="Your video"
        clearable
        withAsterisk
        placeholder="Upload here"
        description="Video formats: mp4, avi, mov"
        accept="video/mp4, video/avi, video/mov"
        onChange={onChange}
      />
      {isVideoUploaded && <>{children}</>}
    </>
  );
};

export default VideoUploader;

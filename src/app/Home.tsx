"use client";

import { useRef, useState, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

import * as helpers from "./utils/utils";
import VideoFilePicker from "./components/VideoFilePicker";
import OutputVideo from "./components/OutputVideo";
import RangeInput from "./components/RangeInput";

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const [inputVideoFile, setInputVideoFile] = useState<any>(null);
  const [trimmedVideoFile, setTrimmedVideoFile] = useState<any>(null);
  const [trimIsProcessing, setTrimIsProcessing] = useState(false);
  const [videoMeta, setVideoMeta] = useState<any>(null);
  const [URL, setURL] = useState<any>(null);
  const [rStart, setRstart] = useState(0);
  const [rEnd, setRend] = useState(10);

  const [thumbnails, setThumbnails] = useState([]);
  const [thumbnailIsProcessing, setThumbnailIsProcessing] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    setLoaded(true);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpdateRange = (func: any) => {
    return ({ target: { value } }: any) => {
      func(value);
    };
  };

  const handleChange = async (e: any) => {
    let file = e.target.files[0];
    console.log(e);
    console.log(file);
    setInputVideoFile(file);
    setURL(await helpers.readFileAsBase64(file));
  };

  const generateThumbnails = async ({ duration }: { duration: number }) => {
    const maxImages = 15;
    const imagesCount = Math.min(duration, maxImages);
    const interval = Math.ceil(duration / imagesCount);

    const ffmpeg = ffmpegRef.current;
    setThumbnailIsProcessing(true);
    await ffmpeg.writeFile(
      inputVideoFile.name,
      await fetchFile(inputVideoFile)
    );

    const thumbnails = [];
    try {
      for (let i = 0; i < imagesCount; i++) {
        const startTime = helpers.toTimeString(i * interval);
        const endTime = helpers.toTimeString((i + 1) * interval);

        await ffmpeg.exec([
          "-ss",
          startTime,
          "-i",
          inputVideoFile.name,
          "-t",
          endTime,
          "-vf",
          "scale=150:-1",
          `img${i}.png`,
        ]);

        const data: any = ffmpeg.readFile(`img${i}.png`);
        const blob: any = new Blob([data.buffer], { type: "image/png" });

        thumbnails.push(await helpers.readFileAsBase64(blob));
      }
    } catch (error) {
      console.error(error);
    }

    setThumbnailIsProcessing(false);
    return thumbnails;
  };

  const handleLoadedData = async (e: any) => {
    const el = e.target;
    const meta = {
      name: inputVideoFile.name,
      duration: el.duration,
      videoWidth: el.videoWidth,
      videoHeight: el.videoHeight,
    };
    console.log({ meta });
    setVideoMeta(meta);

    const thumbnails: any = await generateThumbnails(meta);
    setThumbnails(thumbnails);
  };

  const trimVideo = async () => {
    const ffmpeg = ffmpegRef.current;
    setTrimIsProcessing(true);
    const start = (rStart / 100) * videoMeta.duration;
    const duration = (rEnd / 100) * videoMeta.duration - start;

    try {
      await ffmpeg.writeFile(
        inputVideoFile.name,
        await fetchFile(inputVideoFile)
      );
      await ffmpeg.exec([
        "-ss",
        helpers.toTimeString(start),
        "-i",
        inputVideoFile.name,
        "-t",
        helpers.toTimeString(duration),
        "-c:v",
        "copy",
        "ping.mp4",
      ]);
      const data = (await ffmpeg.readFile("ping.mp4")) as any;
      const dataURL = await helpers.readFileAsBase64(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      setTrimmedVideoFile(dataURL);
    } catch (error) {
      console.error(error);
    } finally {
      setTrimIsProcessing(false);
    }
  };

  if (isLoading) return <span>Loading...</span>;

  return (
    <main className="flex justify-center w-full">
      <div className="flex flex-col">
        <RangeInput
          rEnd={rEnd}
          rStart={rStart}
          handleUpdaterStart={handleUpdateRange(setRstart)}
          handleUpdaterEnd={handleUpdateRange(setRend)}
          loading={thumbnailIsProcessing}
          videoMeta={videoMeta}
          control={
            <div className="u-center">
              <button
                onClick={trimVideo}
                className="btn bg-purple-500 p-2"
                disabled={trimIsProcessing}
              >
                {trimIsProcessing ? "Trimming..." : "Trim video"}
              </button>
            </div>
          }
          thumbnails={thumbnails}
        />
        <div className="flex">
          <VideoFilePicker
            handleChange={handleChange}
            showVideo={!!inputVideoFile}
          >
            <video
              className="w-72"
              src={inputVideoFile ? URL : null}
              autoPlay
              controls
              muted
              onLoadedMetadata={handleLoadedData}
            />
          </VideoFilePicker>
          <OutputVideo
            videoSrc={trimmedVideoFile}
            handleDownload={() => helpers.download(trimmedVideoFile)}
          />
        </div>
      </div>
    </main>
  );
}

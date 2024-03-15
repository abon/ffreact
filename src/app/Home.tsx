"use client";

import { useRef, useState } from "react";
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
  const [rStart, setRstart] = useState(0); // 0%
  const [rEnd, setRend] = useState(10); // 10%

  const [thumbnails, setThumbnails] = useState([]);
  const [thumbnailIsProcessing, setThumbnailIsProcessing] = useState(false);

  const load = async () => {
    setIsLoading(true);
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
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

  const transcode = async () => {
    const ffmpeg = ffmpegRef.current;
    // u can use 'https://ffmpegwasm.netlify.app/video/video-15s.avi' to download the video to public folder for testing
    await ffmpeg.writeFile(
      "input.avi",
      await fetchFile(
        "https://raw.githubusercontent.com/ffmpegwasm/testdata/master/video-15s.avi"
      )
    );
    await ffmpeg.exec(["-i", "input.avi", "output.mp4"]);
    const data = (await ffmpeg.readFile("output.mp4")) as any;
    if (videoRef.current)
      // @ts-ignore
      videoRef.current.src = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
  };

  const handleUpdateRange = (func: any) => {
    return ({ target: { value } }: any) => {
      func(value);
    };
  };

  const handleChange = async (e: any) => {
    let file = e.target.files[0];
    console.log(file);
    setInputVideoFile(file);
    // @ts-ignore
    setURL(await helpers.readFileAsBase64(file));
  };

  const getThumbnails = async ({
    duration,
  }: {
    duration: number;
  }): Promise<string[]> => {
    const arrayOfImageURIs: string[] = [];
    const MAX_NUMBER_OF_IMAGES = 15;
    const NUMBER_OF_IMAGES = Math.min(duration, MAX_NUMBER_OF_IMAGES);
    const offset = Math.ceil(duration / NUMBER_OF_IMAGES);

    const ffmpeg = ffmpegRef.current;
    setThumbnailIsProcessing(true);
    await ffmpeg.writeFile(
      inputVideoFile.name,
      await fetchFile(inputVideoFile)
    );
    try {
      for (let i = 0; i < NUMBER_OF_IMAGES; i++) {
        const startTimeInSecs = helpers.toTimeString(Math.round(i * offset));
        const nextTimeInSecs = helpers.toTimeString(
          Math.round((i + 1) * offset)
        );

        await ffmpeg.exec([
          "-ss",
          startTimeInSecs,
          "-i",
          inputVideoFile.name,
          "-t",
          "00:00:1.000",
          "-vf",
          `scale=150:-1`,
          `img${i}.png`,
        ]);

        const data: any = ffmpeg.readFile(`img${i}.png`);
        const blob: any = new Blob([data.buffer], { type: "image/png" });
        const dataURI: any = await helpers.readFileAsBase64(blob);
        arrayOfImageURIs.push(dataURI);
        // await ffmpeg.deleteFile(`img${i}.png`);
      }
    } catch (error) {
      console.error(error);
    }
    setThumbnailIsProcessing(false);
    return arrayOfImageURIs;
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

    const thumbnails: any = await getThumbnails(meta);
    setThumbnails(thumbnails);
  };

  const handleTrim = async () => {
    const ffmpeg = ffmpegRef.current;
    setTrimIsProcessing(true);
    let startTime: any | number = ((rStart / 100) * videoMeta.duration).toFixed(
      2
    );
    let offset: any = ((rEnd / 100) * videoMeta.duration - startTime).toFixed(
      2
    );

    try {
      await ffmpeg.writeFile(
        inputVideoFile.name,
        await fetchFile(inputVideoFile)
      );
      await ffmpeg.exec([
        "-ss",
        helpers.toTimeString(startTime),
        "-i",
        inputVideoFile.name,
        "-t",
        helpers.toTimeString(offset),
        "-c:v",
        "copy",
        "ping.mp4",
      ]);
      const data = (await ffmpeg.readFile("ping.mp4")) as any;
      console.log(data);
      const dataURL: any = await helpers.readFileAsBase64(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      setTrimmedVideoFile(dataURL);
    } catch (error) {
      console.error(error);
    } finally {
      setTrimIsProcessing(false);
    }
  };

  return loaded ? (
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
                onClick={handleTrim}
                className="btn bg-purple-500 p-2"
                disabled={trimIsProcessing}
              >
                {trimIsProcessing ? "Trimming..." : "Trim video"}
              </button>
            </div>
          }
          thumbnails={thumbnails}
        />

        <VideoFilePicker
          handleChange={handleChange}
          showVideo={!!inputVideoFile}
        >
          <video
            className="w-3/4"
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
    </main>
  ) : (
    <button
      className="flex justify-center items-center bg-green-800 p-5"
      onClick={load}
    >
      Press to load FFmpeg
    </button>
  );
}

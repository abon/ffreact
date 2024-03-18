"use client";

import { useRef, useState, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

import { Grid, Stack } from "@mantine/core";
import VideoUploader from "./components/VideoUploader";
import * as helpers from "./utils/utils";
import RangeInput from "./components/RangeInput";
import OutputVideo from "./components/OutputVideo";

const Main = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const [URL, setURL] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const [inputVideoFile, setInputVideoFile] = useState<any>(null);
  const [videoMeta, setVideoMeta] = useState<any>(null);

  const [trimIsProcessing, setTrimIsProcessing] = useState(false);
  const [trimmedVideoFile, setTrimmedVideoFile] = useState<any>(null);

  const [trimStartSec, setTrimStartSec] = useState(0);
  const [trimEndSec, setTrimEndSec] = useState(10);

  const [thumbnails, setThumbnails] = useState([]);
  const [thumbnailIsProcessing, setThumbnailIsProcessing] = useState(false);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, []);

  const onVideoUpload = async (e: any) => {
    console.log(e);
    setInputVideoFile(e);
    setURL(await helpers.readFileAsBase64(e));
  };

  const handleUpdateRange = (func: any) => {
    return ({ target: { value } }: any) => {
      func(value);
    };
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
    const thumbs: any = await generateThumbnails(meta);
    setThumbnails(thumbs);
  };

  const trimVideo = async () => {
    const ffmpeg = ffmpegRef.current;
    setTrimIsProcessing(true);
    const start = (trimStartSec / 100) * videoMeta.duration;
    const duration = (trimEndSec / 100) * videoMeta.duration - start;

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

  const generateThumbnails = async ({ duration }: { duration: number }) => {
    const generatedThumbnails = [];
    const numThumbnails = 15;
    const imagesCount = Math.min(duration, numThumbnails);
    const interval = Math.ceil(duration / imagesCount);

    const ffmpeg = ffmpegRef.current;
    setThumbnailIsProcessing(true);
    await ffmpeg.writeFile(
      inputVideoFile.name,
      await fetchFile(inputVideoFile)
    );
    try {
      for (let i = 0; i < imagesCount; i++) {
        await ffmpeg.exec([
          "-i",
          "input.mp4",
          "-ss",
          `${interval * i}`,
          "-frames:v",
          "1",
          `thumbnail${i}.png`,
        ]);
        const thumbnailData: any = ffmpeg.readFile(`thumbnail${i}.png`);

        const blob: any = new Blob([thumbnailData.buffer], {
          type: "image/png",
        });

        const dataURI = await helpers.readFileAsBase64(blob);
        generatedThumbnails.push(dataURI);
      }
    } catch (error) {
      console.error(error);
    }
    setThumbnailIsProcessing(false);
    return generatedThumbnails;
  };

  console.log(thumbnails);
  return (
    <div className="h-vh p-10 bg-neutral-100 mt-10 rounded-3xl">
      <Grid>
        <Grid.Col span={12}>
          <VideoUploader
            onChange={onVideoUpload}
            isVideoUploaded={!!inputVideoFile}
            meta={videoMeta}
          >
            <video
              className="rounded-lg"
              src={inputVideoFile ? URL : null}
              autoPlay
              controls
              muted
              onLoadedMetadata={handleLoadedData}
            />
          </VideoUploader>
          <RangeInput
            rEnd={trimEndSec}
            rStart={trimStartSec}
            handleUpdaterStart={handleUpdateRange(setTrimStartSec)}
            handleUpdaterEnd={handleUpdateRange(setTrimEndSec)}
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
          <OutputVideo
            videoSrc={trimmedVideoFile}
            handleDownload={() => helpers.download(trimmedVideoFile)}
          />
        </Grid.Col>
      </Grid>
    </div>
  );
};

export default Main;

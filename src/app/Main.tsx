"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { MdContentCut } from "react-icons/md";
import Draggable from "react-draggable";

import { FileInput, Grid, Stack } from "@mantine/core";
import VideoUploader from "./components/VideoUploader";
import * as helpers from "./utils/utils";
import RangeInput from "./components/RangeInput";
import OutputVideo from "./components/OutputVideo";

import { IoIosDownload } from "react-icons/io";

const Main = () => {
  const router = useRouter();
  const ffmpegRef = useRef(new FFmpeg());
  const [loaded, setLoaded] = useState(false);
  const [URL, setURL] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const [inputVideoFile, setInputVideoFile] = useState<any>(null);
  const [videoMeta, setVideoMeta] = useState<any>(null);

  const [inputImageFile, setInputImageFile] = useState<any>(null);
  const imageRef = useRef(null);
  const [imageURL, setImageURL] = useState<any>(null);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });

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

  const onImageUpload = async (e: any) => {
    console.log(e);
    setInputImageFile(e);
    setImageURL(await helpers.readFileAsBase64(e));
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
        "-i",
        inputVideoFile.name,
        "-ss",
        helpers.toTimeString(start),
        "-t",
        helpers.toTimeString(duration),
        "-c:v",
        "copy",
        "output.mp4",
      ]);

      const data = (await ffmpeg.readFile("output.mp4")) as any;
      const dataURL = await helpers.readFileAsBase64(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      setTrimmedVideoFile(dataURL);
      // router.push("/download");
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
          "ping.mp4", // intentionally left as ping.mp4
          // inputVideoFile.name,
          "-ss",
          `${interval * i}`,
          "-vf",
          "fps=1",
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

  const handleImagePosition = (e: any, data: { x: any; y: any }) => {
    setOverlayPosition({ x: data.x, y: data.y });
  };

  return (
    <div className="h-vh p-10 bg-neutral-100 mt-10 rounded-3xl">
      <Grid>
        <FileInput
          clearable
          label="Overlay Image"
          description="Image formats: png, jpg"
          placeholder="Your image"
          accept="image/png, image/jpeg, image/jpg"
          onChange={onImageUpload}
        />
        {inputImageFile ? (
          <Draggable onDrag={handleImagePosition}>
            <img
              ref={imageRef}
              src={inputImageFile ? imageURL : null}
              alt=""
              className="h-12 w-11"
            />
          </Draggable>
        ) : (
          ""
        )}

        <Grid.Col span={12}>
          <VideoUploader
            onChange={onVideoUpload}
            isVideoUploaded={!!inputVideoFile}
            meta={videoMeta}
          >
            <video
              className="rounded-lg mt-4"
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
              <button
                className="flex items-center justify-center gap-2 h-full w-full text-white text-xl font-medium  bg-indigo-500 rounded-md p-2 mt-5"
                onClick={trimVideo}
                disabled={trimIsProcessing}
              >
                <MdContentCut />
                {trimIsProcessing ? "Trimming..." : "Apply "}
              </button>
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

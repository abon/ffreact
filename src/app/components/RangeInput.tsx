import { Loader } from "@mantine/core";

import Image from "next/image";
import * as helpers from "../utils/utils";

export default function RangeInput({
  thumbnails,
  rEnd,
  rStart,
  handleUpdaterStart,
  handleUpdaterEnd,
  loading,
  control,
  videoMeta,
}: any) {
  const RANGE_MAX = 100;

  if (!thumbnails.length && !loading) return null;
  if (loading) {
    return (
      <div className="flex justify-center items-center mt-1">
        <Loader color="blue" />
      </div>
    );
  }

  return (
    <>
      <div className="range_pack">
        <div className="image_box">
          {thumbnails.map((thumbnail: any, id: string) => (
            <div key={id} className="w-full h-full bg-teal-50"></div>
            // <Image src={thumbnail} alt={`thumbnail_${id}` with={20} height={20}/>
          ))}

          <div
            className="clip_box"
            style={{
              width: `calc(${rEnd - rStart}% )`,
              left: `${rStart}%`,
            }}
            data-start={helpers.toTimeString(
              (rStart / RANGE_MAX) * videoMeta.duration,
              false
            )}
            data-end={helpers.toTimeString(
              (rEnd / RANGE_MAX) * videoMeta.duration,
              false
            )}
          >
            <span className="clip_box_des"></span>
            <span className="clip_box_des"></span>
          </div>

          <input
            className="range"
            type="range"
            min={0}
            max={RANGE_MAX}
            onInput={handleUpdaterStart}
            value={rStart}
          />
          <input
            className="range"
            type="range"
            min={0}
            max={RANGE_MAX}
            onInput={handleUpdaterEnd}
            value={rEnd}
          />
        </div>
      </div>
      <div className="flex justify-center items-center">{control}</div>
    </>
  );
}

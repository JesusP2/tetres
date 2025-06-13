import { UploadButton, useUploadThing } from "@web/lib/uploadthing";

export function MyUploadButton(props: {
  acceptTypes: string;
} & Parameters<(typeof UploadButton)>[0]) {
  const { startUpload } = useUploadThing(props.endpoint, props)
  return (
    <div>
      <label
        data-ut-element="button"
      >
        <input className="hidden" type="file" onChange={
          (e) => {
            e.preventDefault();
            const file = e.target.files?.item(0)
            if (!file) return;
            startUpload([file]);
          }
        } />
        Attachment
      </label>
      <div
        data-ut-element="allowed-content"
        className="sr-only"
      >
        {props.acceptTypes}
      </div>
    </div>
  )
}

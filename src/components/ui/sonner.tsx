import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      {...props}
      theme="dark"
      richColors={false}
      closeButton
      className={`toaster namflirt-toaster ${props.className ?? ""}`}
      icons={{
        success: <CircleCheck className="h-[18px] w-[18px]" />,
        info: <Info className="h-[18px] w-[18px]" />,
        warning: <TriangleAlert className="h-[18px] w-[18px]" />,
        error: <CircleAlert className="h-[18px] w-[18px]" />,
        loading: <LoaderCircle className="h-[18px] w-[18px] animate-spin" />,
        close: <X className="h-3.5 w-3.5" />,
      }}
      toastOptions={{
        ...props.toastOptions,
        classNames: {
          toast: "namflirt-toast",
          title: "namflirt-toast-title",
          description: "namflirt-toast-description",
          icon: "namflirt-toast-icon",
          success: "namflirt-toast--success",
          error: "namflirt-toast--error",
          info: "namflirt-toast--info",
          warning: "namflirt-toast--warning",
          loading: "namflirt-toast--loading",
          actionButton: "namflirt-toast-action",
          cancelButton: "namflirt-toast-cancel",
          closeButton: "namflirt-toast-close",
        },
      }}
    />
  );
};

export { Toaster };

import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Video from 'yet-another-react-lightbox/plugins/video';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import type { LightboxSlide } from '../../types/gallery';

interface LightboxViewerProps {
  open: boolean;
  index: number;
  slides: LightboxSlide[];
  onClose: () => void;
}

export default function LightboxViewer({
  open,
  index,
  slides,
  onClose,
}: LightboxViewerProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Captions, Video, Zoom, Thumbnails]}
      captions={{ showToggle: true }}
      zoom={{ scrollToZoom: true }}
      thumbnails={{ position: 'bottom' }}
    />
  );
}

import gifshot from 'gifshot/dist/gifshot.js';

const VIDEO_UPLOAD = '[js-video-upload]';
const VIDEO_PREVIEW = '[js-video-preview]';
const VIDEO_PREVIEW_FILE = '[js-video-preview-file]';
const CONVERT_BUTTON = '[js-convert-button]';

const TIMELINE_CURRENT = '[js-timeline-current]';
const TIMELINE_FROM = '[js-timeline-from]';
const TIMELINE_TILL = '[js-timeline-till]';
const VIDEO_ACTIVE_CLASS = 'video--active';
const IS_DRAGING_CLASS = 'is--draging';

const body = document.body;
const timelineWidth = 300;

class VideoTimeline {
    constructor(element) {
        this.element = element;
        this.upload = this.element.querySelector(VIDEO_UPLOAD);
        this.preview = this.element.querySelector(VIDEO_PREVIEW);
        this.previewFile = this.element.querySelector(VIDEO_PREVIEW_FILE);
        this.convertButton = this.element.querySelector(CONVERT_BUTTON);
        this.videoDuration;

        this.marginLeft = {};
        this.timeline = {};
        this.timeline.from = document.querySelector(TIMELINE_FROM);
        this.timeline.till = document.querySelector(TIMELINE_TILL);

        this.bindEvents();
    }

    bindEvents() {
        this.upload.addEventListener('change', () => this.showPreview());
        this.convertButton.addEventListener('click', () => this.videoToGif());
    }

    showPreview() {
        this.previewFile.src = URL.createObjectURL(this.upload.files[0]);
        this.preview.load();

        this.element.classList.add(VIDEO_ACTIVE_CLASS);

        this.timeline.from.addEventListener('touchstart', () => {
            this.drag = 'from';
            this.timeline.from.classList.add(IS_DRAGING_CLASS);
        });
        this.timeline.till.addEventListener('touchstart', () => {
            this.drag = 'till';
            this.timeline.till.classList.add(IS_DRAGING_CLASS);
        });

        this.timeline.from.addEventListener('touchend', () => {
            this.touchEndTimeline();
        });
        this.timeline.till.addEventListener('touchend', () => {
            this.touchEndTimeline();
        });

        document.addEventListener('touchmove', event => this.timelineDrag(event, this.preview));
        this.showTimeline(this.preview);
    }

    touchEndTimeline() {
        this.draging = false;
        this.drag = false;
        this.timeline.from.classList.remove(IS_DRAGING_CLASS);
        this.timeline.till.classList.remove(IS_DRAGING_CLASS);
        this.trimVideo(this.startTime, this.endTime);
        this.videoDuration = this.endTime - this.startTime;
    }

    removePreview() {
        URL.revokeObjectURL(this.previewFile.src);
    }

    trimVideo(startTime, endTime) {
        this.preview.style.height = `${this.preview.offsetHeight}px`;
        this.removePreview();
        clearTimeout(this.loopTrimVideo);

        this.previewFile.src = URL.createObjectURL(this.upload.files[0]) + `#t=${startTime},${endTime}`;
        this.preview.load();

        this.playTrimVideo(startTime, endTime);
    }

    playTrimVideo(startTime, endTime) {
        const stopVideoAfter = (endTime - startTime) * 1000;

        this.loopTrimVideo = setTimeout(() =>{
            this.preview.pause();
            this.preview.currentTime = startTime;
            this.preview.play();

            this.playTrimVideo(startTime, endTime);
        }, stopVideoAfter);
    }

    showTimeline(video) {
        const current = document.querySelector(TIMELINE_CURRENT);
        current.style.left = this.currentTime(video);
        
        setTimeout(() =>{
            this.showTimeline(video);
        }, 100);
    }

    timelineDrag(event, video) {
        if(this.drag) {
            if(this.draging) {
                const position = this.draging - event.touches[0].screenX;
                this.marginLeft[this.drag] = parseFloat(this.timeline[this.drag].style.marginLeft);

                if(!this.marginLeft.till) this.marginLeft.till = timelineWidth;
                if(!this.marginLeft.from) this.marginLeft.from = 0;
                
                let newPosition = this.marginLeft[this.drag] - position;
                if(newPosition > timelineWidth) newPosition = timelineWidth;
                if(newPosition < 0) newPosition = 0;
                
                this.timeline[this.drag].style.marginLeft = `${newPosition}px`;

                this.marginLeft.till = parseFloat(this.timeline.till.style.marginLeft);
                this.marginLeft.from = parseFloat(this.timeline.from.style.marginLeft);

                if(!this.marginLeft.till) this.marginLeft.till = timelineWidth;
                if(!this.marginLeft.from) this.marginLeft.from = 0;

                this.startTime = (this.marginLeft.from / timelineWidth) * video.duration;
                this.endTime = (this.marginLeft.till / timelineWidth) * video.duration;
            }
            this.draging = event.touches[0].screenX;
        }
    }

    currentTime(video) {
        const currentTime = (video.currentTime / video.duration) * timelineWidth;
        return `${currentTime}px`;
    }

    videoToGif() {
        if(!this.videoDuration) this.videoDuration = this.preview.duration;
        if(this.videoDuration > 10) this.videoDuration = 10; //Gif can't be longer then 10 sec.
        const frames = Math.floor(this.videoDuration * 10);

        body.classList.add('is--loading');

        gifshot.createGIF({
            gifWidth: this.preview.offsetWidth * 1.5,
            gifHeight: this.preview.offsetHeight * 1.5,
            video: [
                `${this.previewFile.src}`,
            ],
            numFrames: frames,
        }, (obj) => {
            if (!obj.error) {
                body.classList.remove('is--loading');
                this.element.classList.add('is--hidden');
                
                const gif = document.querySelector('[js-gif]');
                const gifImage = gif.querySelector('[js-gif-image]');
                gif.classList.remove('is--hidden');
                gifImage.src = obj.image;
            }
        });
    }
}

export default VideoTimeline;

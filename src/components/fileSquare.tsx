import { GripVertical, LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

type FileSquareProps = {
    fileIcon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
    fileName: string;
    fileSize: number;
};

const FileSquare = ({ fileIcon: FileIcon, fileName, fileSize }: FileSquareProps) => {
    return (
        <div className="tooltip" data-tip={fileName}>
            <div className="text-left bg-base-100 hover:brightness-200 hover:cursor-move p-2 grid grid-cols-10 items-center gap-5">
                <GripVertical size={16} className="text-darker col-span-1" />
                <FileIcon className='text-accent col-span-2' />
                <div className="flex flex-col col-span-7">
                    <p className="line-clamp-2 break-all text-sm max-w-[180px]">{fileName}</p>
                    <p className="text-darker text-xs">{(fileSize / (1024)).toFixed(1)} MB</p>
                </div>
            </div>
        </div>
    );
};

export default FileSquare;
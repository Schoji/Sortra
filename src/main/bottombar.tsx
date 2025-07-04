import { ChevronRight, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { formatBytes } from '../functions/formatBytes';

type BottomBarProps = {
    files: number,
    extensions: number,
    groups: number,
    totalSize: number,
    mostCommonExtension: string,
    mostCommonNumber: number,
    resetFunction: () => void,
    sortDisabled: boolean,
    sortFunction: () => void,
};

const BottomBar = ({ files, extensions, groups, totalSize, mostCommonExtension, mostCommonNumber, resetFunction, sortFunction, sortDisabled }: BottomBarProps) => {
    return (
        <div className="p-5 grid sm:flex justify-center sm:justify-between items-center gap-5 bg-base-200">
            <div className='flex gap-2 invisible sm:visible'>
                <div className="text-sm">
                    <span className='text-darker'> Files: </span>
                    <span className='text-primary'>{files}</span>

                </div>
                <div className="text-sm">
                    <span className='text-darker'> Extensions: </span>
                    <span className='text-primary'>{extensions}</span>
                </div>
                <div className="text-sm">
                    <span className='text-darker'>Groups: </span>
                    <span className='text-primary'>{groups}</span>

                </div>
                <div className="text-sm invisible md:visible">
                    <span className='text-darker'>Common: </span>
                    <span className='text-primary'>{`${mostCommonExtension} (${mostCommonNumber})`}</span>
                </div>
                <div className="text-sm invisible md:visible">
                    <span className='text-darker'> Total size: </span>
                    <span className='text-primary'>{formatBytes(totalSize)}</span>
                </div>
            </div>
            {/* Actions */}
            <div className='flex gap-2 items-center justify-center'>
                <motion.button
                    className="btn btn-outline border-base-100-50"
                    whileHover={{ scale: 1.05 }}
                    onClick={resetFunction}
                >
                    <RotateCcw className="text-darker" size={16} />
                    Reset groups
                </motion.button>
                <motion.button className="btn btn-primary" disabled={sortDisabled} whileHover={{ scale: 1.05 }} onClick={sortFunction}>
                    Sort <ChevronRight size={16} />
                </motion.button>
            </div>
        </div>
    );
};

export default BottomBar;
import { FolderOpen } from 'lucide-react';
import { motion } from 'motion/react';

type TopBarProps = {
    directory: string;
    getDirectory: () => void,
};

const TopBar = ({ directory, getDirectory }: TopBarProps) => {
    return (
        <div className="navbar bg-base-200 shadow-sm border-b-2 border-base-100-50 fixed z-50">
            <div className="navbar-start pl-5 gap-5 items-center">
                <div className="flex gap-2 items-center">
                    <FolderOpen className="bg-primary p-1 rounded-md" />
                    <h1 className="text-xl font-semibold hidden sm:block">Sortra</h1>
                </div>
            </div>
            <div className="navbar-center hidden sm:block">
                {directory != "" &&
                    <div className="flex items-center gap-2 text-sm invisible sm:visible bg-base-100 p-2 rounded-lg pl-10 pr-10">
                        <FolderOpen size={16} className="text-accent" />
                        {/* Directory */}
                        <p className="text-darker" title={directory}>
                            {directory.length > 40 ? `...${directory.slice(-37)}` : directory}
                        </p>
                    </div>
                }
            </div>
            <div className="navbar-end">
                <motion.button
                    className="btn btn-sm btn-primary"
                    onClick={getDirectory}
                    animate={directory == "" ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                    transition={
                        directory == ""
                            ? {
                                duration: 1.2,
                                repeat: Infinity,
                                repeatType: "loop",
                                ease: "easeInOut",
                            }
                            : { duration: 0.2 }
                    }
                    whileHover={{
                        scale: 1.04,
                        boxShadow: "0px 2px 6px rgba(0,0,0,0.10)",
                    }}
                    whileTap={{
                        scale: 0.95,
                        rotate: 0
                    }}
                >
                    <FolderOpen size={20} />
                    Change Folder
                </motion.button>
            </div>
        </div>
    );
};

export default TopBar;
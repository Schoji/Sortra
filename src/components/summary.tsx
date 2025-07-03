type summaryProps = {
    filesLength: number,
    extensionsLength: number,
    groupsLength: number;
};

const Summary = ({ filesLength, extensionsLength, groupsLength }: summaryProps) => {
    return (
        <div className="border-2 border-base-100-50 p-5 rounded-xl text-left">
            <h1 className="text-xl font-semibold">Summary</h1>
            <div className="pt-3 grid grid-cols-2 gap-y-1">
                <p className="text-sm text-darker">Files: </p>
                <p className="text-sm text-primary text-right">{filesLength}</p>
                <p className="text-sm text-darker">Types: </p>
                <p className="text-sm text-primary text-right">{extensionsLength}</p>
                <p className="text-sm text-darker">Groups: </p>
                <p className="text-sm text-primary text-right">{groupsLength}</p>
            </div>
        </div>
    );
};

export default Summary;
export const batchStates=['waiting','queued','running','completed','failed','cancelled','skipped'] as const;
export type BatchState=typeof batchStates[number];
export const batchLabels:Record<BatchState,string>={waiting:'Waiting to submit',queued:'Queued',running:'Running',completed:'Completed',failed:'Failed',cancelled:'Cancelled',skipped:'Skipped'};
export type BatchProgress={id:string;title:string;createdAt:string;checkedAt:string;counts:Record<BatchState,number>;total:number;finished:number;entries:{repository:string;state:BatchState;verdict:string|null;reportUrl:string|null;detail:string|null;updatedAt:string|null}[]};

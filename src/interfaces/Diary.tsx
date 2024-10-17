import { Entry } from "./Entry";

export interface Diary {
    id: string,
    userId:string,
    title:string,
    description:string,
    createdAt:Date,
    updatedAt:Date,
    diaryEntry:Entry[]
}
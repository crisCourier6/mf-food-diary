import { Diary } from "./Diary";

export interface Entry {
    id:string,
    diaryId:string,
    date: Date,
    title:string,
    content:string,
    foodDiary: Diary
}
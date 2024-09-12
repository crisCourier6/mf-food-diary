import React, { useEffect } from "react";
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Button, Box, TextField, Alert, Paper, Typography, Grid, CircularProgress, Badge} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form"
import axios from 'axios';
import { useState } from 'react';
import GoogleIcon from '@mui/icons-material/Google';
import Calendar from 'react-calendar';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import { DateCalendar} from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import 'react-calendar/dist/Calendar.css'; // Import the calendar styles
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ConstructionOutlined } from "@mui/icons-material";
import 'dayjs/locale/es';

function getHighlightedDays(tasks: any[], currentMonth: Dayjs | null) {
    console.log(currentMonth?.month())
    if (currentMonth){
        return tasks
        .filter(task => dayjs(task.due).month() === currentMonth.month())
        .map(task => dayjs(task.due).date());
    }
    return []
    
  }

  function TaskDay(props: PickersDayProps<Dayjs> & { highlightedDays?: number[] }) {
    const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  
    const isHighlighted =
      !outsideCurrentMonth && highlightedDays.indexOf(day.date()) >= 0;
  
    return (
      <Badge
        key={day.toString()}
        overlap="circular"
        badgeContent={isHighlighted ? '📌' : undefined}
        sx={{ position: 'relative' }}
      >
        <PickersDay outsideCurrentMonth={outsideCurrentMonth} {...other} day={day} />
      </Badge>
    );
  }

const FoodDiary: React.FC = () => {
    const navigate = useNavigate()
    const [taskLists, setTaskLists] = useState<any>(null)
    const [highlightedDays, setHighlightedDays] = useState<number[]>([]);
    const [tasks, setTasks] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [filteredTasks, setFilteredTasks] = useState<any>([]);
    const [error, setError] = useState<string | null>(null);
    const [loadingTaskLists, setLoadingTaskLists] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(false);
     const url = "http://192.168.100.6:8080/auth/login/google"

     useEffect(() => {
        setSelectedDate(dayjs())
        if (window.localStorage.g_auth) {
            axios.get('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
                headers: {
                    Authorization: `Bearer ${window.localStorage.g_auth}`
                }
            })
            .then(response => {
                setTaskLists(response.data.items)
                setLoadingTaskLists(false); // Stop loading once task lists are fetched
            })
            .catch(error => console.log(error));
            setLoadingTaskLists(false); // Stop loading on error as well
        }
    }, []);

    useEffect(()=>{
        let date = selectedDate
        const tasksForDate = tasks?.filter((task: any) => 
            {   
                if (task.due){
                    const taskDueDate = dayjs(task.due).format("DD/MM/YYYY"); 
                    // Format selected date to yyyy-mm-dd
                    const selectedFormattedDate = dayjs(date).format("DD/MM/YYYY");
                    console.log(taskDueDate, selectedFormattedDate)
                    return taskDueDate === selectedFormattedDate;
                }
            }
        );
        setFilteredTasks(tasksForDate || []);
    },[tasks])

    const handleTaskList = (id: string) => {
        setLoadingTasks(true); // Start loading when fetching tasks
        axios.get(`https://tasks.googleapis.com/tasks/v1/lists/${id}/tasks`, {
            headers: {
                Authorization: `Bearer ${window.localStorage.g_auth}`
            }
        })
        .then(response => {
            const tasksWithDates = response.data.items.map((task: any) => ({
                ...task,
                notes: task.notes ? task.notes.split('\n') : [],
                due: task.due ? dayjs(task.due).add(1, "day") : null
            }));
            setTasks(tasksWithDates);
            setHighlightedDays(getHighlightedDays(tasksWithDates, selectedDate));
            setLoadingTasks(false);
    })
        .catch(error => console.log(error));
        setLoadingTasks(false); // Stop loading on error
    }

    const handleDateClick = (date: Dayjs) => {
        setSelectedDate(date);
        const tasksForDate = tasks?.filter((task: any) => 
            {   
                if (task.due){
                    const taskDueDate = dayjs(task.due).format("DD/MM/YYYY"); 
                    // Format selected date to yyyy-mm-dd
                    const selectedFormattedDate = dayjs(date).format("DD/MM/YYYY");
                    console.log(taskDueDate, selectedFormattedDate)
                    return taskDueDate === selectedFormattedDate;
                }
                return false;
            }
        );
        setFilteredTasks(tasksForDate || []);
    };

    const handleMonthChange = (date: Dayjs) => {
        setSelectedDate(date.startOf('month'));
        // Update highlightedDays based on the new month
        // ...
      };

    return <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
         <Grid 
        container 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center" 
        sx={{ width: "100vw", maxWidth: "500px", gap: "10px" }}>

        {loadingTaskLists ? (
            <CircularProgress />
        ) : taskLists ? (
            taskLists.map((list: any) => (
                <Button key={list.id} onClick={() => handleTaskList(list.id)}>
                    {list.title}
                </Button>
            ))
        ) : (
            <Typography>No hay listas disponibles</Typography>  // Handle case where no task lists are found
        )}

        {tasks && !loadingTasks && (
            <>
               <DateCalendar
                    value={selectedDate}
                    renderLoading={() => <DayCalendarSkeleton />}
                    onMonthChange={handleMonthChange}
                    onChange={(newValue) => handleDateClick(newValue)}
                    slots={{
                    day: TaskDay,
                    }}
                    slotProps={{
                    day: {
                        highlightedDays: getHighlightedDays(tasks || [], selectedDate)
                    } as any,
                    }}
                />
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task: any) => (
                        <Box key={task.id} sx={{ border: "5px solid", borderColor: "primary.main", width: "90%" }}>
                            <Paper elevation={0} square={true} sx={{ bgcolor: "primary.main", color: "primary.contrastText", justifyContent: "space-between", alignItems: "center", display: "flex", px: 1, pb: "5px" }}>
                                <Typography variant='h6' color="primary.contrastText">{task.title}</Typography>
                                <Typography variant='subtitle1' color="primary.contrastText">{dayjs(task.due).format("DD/MM/YYYY")}</Typography>
                            </Paper>
                            <Paper elevation={0}>
                                {task.notes.map((note: any) => (
                                    <Typography key={note} variant='subtitle1' color="primary.dark" textAlign={"left"} sx={{ my: 1, ml: 1 }}>
                                        - {note}
                                    </Typography>
                                ))}
                            </Paper>
                        </Box>
                    ))
                ) : (
                    <Typography>No hay registros en la fecha seleccionada</Typography>
                )}
            </>
        )}

        {loadingTasks && <CircularProgress />}  {/* Show spinner while tasks are loading */}
    </Grid>
    </LocalizationProvider>
                
  
}

export default FoodDiary
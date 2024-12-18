import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Button, Box, TextField, Paper, Typography, Grid, CircularProgress, 
    Badge, Dialog, DialogTitle, DialogContent, DialogActions, IconButton} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from "../api";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { DateCalendar} from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import 'react-calendar/dist/Calendar.css'; 
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import 'dayjs/locale/es';
import { TimePicker } from "@mui/x-date-pickers";
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import EditNoteRoundedIcon from '@mui/icons-material/EditNoteRounded';

interface Task {
    due: string;
    title: string;
    notes?: string[];
}

function getHighlightedDays(tasks: any[], currentMonth: Dayjs | null) {
    // console.log(currentMonth?.month())
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

  const AddTaskForm: React.FC<{ listId:string, selectedDate: Dayjs, 
                                onClose: () => void,
                                setTasks: React.Dispatch<React.SetStateAction<any[]>>}> 
   = ({ selectedDate, onClose, listId, setTasks }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [taskNotes, setTaskNotes] = useState('');
    const [selectedTime, setSelectedTime] = useState<Dayjs|null>(dayjs());
    const entriesURL = "/diary-entry-google"
  
    const handleAddTask = () => {
        if (!taskTitle) return; // Prevent creating empty tasks
        
    const taskDueDateTime = selectedDate
        .hour(selectedTime?.hour() || 0)
        .minute(selectedTime?.minute() || 0);

    const formattedTime = taskDueDateTime.format('hh:mm A'); // Adjust format as needed
    const newTaskTitle = `${taskTitle} - ${formattedTime}`; // Append time to task title
    
    const newTask = {
        title: newTaskTitle,
        notes: taskNotes,
        due: taskDueDateTime.toISOString(), // Set due date to the selected date
    };
  
      // API call to add task
      api.post(
        `${entriesURL}/${window.localStorage.g_auth}/${listId}`,
        newTask,
        {
          headers: {
            Authorization: `Bearer ${window.localStorage.token}`,
          },
        }
      )
        .then((response) => {
          //console.log('Task created:', response.data);
          // Update local tasks state
            setTasks((prevTasks) => [...(prevTasks || []), 
            { ...response.data, 
                notes: response.data.notes ? response.data.notes.split('\n') : [],
                due: response.data.due ? dayjs(response.data.due).add(1, "day") : null }]); // Ensure to add task with new id

          onClose();  // Close the dialog after task creation
        })
        .catch((error) => console.log(error));
    };
  
    return (
      <Dialog open={true} onClose={onClose}>
        <DialogTitle>Agregar registro en {selectedDate.format('DD/MM/YYYY')}</DialogTitle>
        <DialogContent>
          <Grid container direction="column" gap={2}>
            <TextField
              label="Título"
              value={taskTitle}
              inputProps = {{maxLength: 100}}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Remove "-" characters from the input
                const sanitizedValue = inputValue.replace(/-/g, ','); 
                setTaskTitle(sanitizedValue);
                }}
              variant="outlined"
              sx={{mt: 2}}
            />
            <TextField
              label="Detalles"
              inputProps = {{maxLength: 500}}
              value={taskNotes}
              onChange={(e) => setTaskNotes(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                label="Hora"
                value={selectedTime}
                onChange={(newTime) => setSelectedTime(newTime)}
                />
            </LocalizationProvider>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Salir</Button>
          <Button onClick={handleAddTask} color="primary" variant="contained">Agregar registro</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const EditTaskForm: React.FC<{ listId:string, selectedDate: Dayjs, task: any,
                                onClose: () => void,
                                setTasks: React.Dispatch<React.SetStateAction<any[]>>}> 
   = ({ selectedDate, onClose, listId, setTasks, task }) => {
    const [taskTitle, setTaskTitle] = useState(task.title.split(" -")[0]);
    const [taskNotes, setTaskNotes] = useState(task.notes.join("\n"));
    const [selectedTime, setSelectedTime] = useState<Dayjs|null>(dayjs());
    const entriesURL = "/diary-entry-google"
  
    const handleEditTask = () => {
        if (!taskTitle) return; // Prevent creating empty tasks
        if (taskTitle === task.title.split(" -")[0] && taskNotes === task.notes.join("\n")){
            //console.log(taskTitle, task.title.split(" -")[0])
            return
        } 
        const taskDueDateTime = selectedDate
            .hour(selectedTime?.hour() || 0)
            .minute(selectedTime?.minute() || 0);

        const formattedTime = taskDueDateTime.format('hh:mm A'); // Adjust format as needed
        const newTaskTitle = `${taskTitle} - ${formattedTime}`; // Append time to task title
        
        const newTask = {
            entryId: task.id,
            title: newTaskTitle,
            notes: taskNotes,
            due: taskDueDateTime.toISOString(), // Set due date to the selected date
        };
        //console.log(newTask)
        // API call to add task
        api.patch(
            `${entriesURL}/${window.localStorage.g_auth}/${listId}`,
            newTask,
            {
            headers: {
                Authorization: `Bearer ${window.localStorage.token}`,
            },
            }
        )
            .then((response) => {
            //console.log('Task updated:', response.data);
            // Update local tasks state
                setTasks((prevTasks) => prevTasks.map((t) => 
                    t.id === task.id 
                        ? {
                            ...response.data, // Updated task data from the response
                            notes: response.data.notes ? response.data.notes.split('\n') : [],
                            due: response.data.due ? dayjs(response.data.due).add(1, "day") : null,
                        }
                        : t // Keep the other tasks unchanged
                ))

            onClose();  // Close the dialog after task creation
            })
            .catch((error) => console.log(error));
    };
  
    return (
      <Dialog open={true} onClose={onClose}>
        <DialogTitle>Editar registro en {selectedDate.format('DD/MM/YYYY')}</DialogTitle>
        <DialogContent>
          <Grid container direction="column" gap={2}>
            <TextField
              label="Título"
              value={taskTitle}
              inputProps = {{maxLength: 100}}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Remove "-" characters from the input
                const sanitizedValue = inputValue.replace(/-/g, ','); 
                setTaskTitle(sanitizedValue);
                }}
              variant="outlined"
              sx={{mt:2}}
            />
            <TextField
              label="Detalles"
              value={taskNotes}
              inputProps = {{maxLength: 500}}
              onChange={(e) => setTaskNotes(e.target.value)}
              variant="outlined"
              multiline
              rows={3}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                label="Hora"
                value={selectedTime}
                onChange={(newTime) => setSelectedTime(newTime)}
                />
            </LocalizationProvider>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Salir</Button>
          <Button onClick={handleEditTask} color="primary" variant="contained">Modificar registro</Button>
        </DialogActions>
      </Dialog>
    );
  };

const FoodDiary: React.FC = () => {
    const [taskLists, setTaskLists] = useState<any>([])
    const [googleUser, setGoogleUser] = useState(true)
    const [selectedTaskList, setSelectedTaskList] = useState<string>("");
    // const [highlightedDays, setHighlightedDays] = useState<number[]>([]);
    const [tasks, setTasks] = useState<any>(null)
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
    const [filteredTasks, setFilteredTasks] = useState<any>([]);
    const [loadingTaskLists, setLoadingTaskLists] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [newTaskListTitle, setNewTaskListTitle] = useState<string>('')
    const [openNewDiarydialog, setOpenNewDiaryDialog] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<any>(null);
    const diariesURL = "/food-diary-google"
    const entriesURL = "/diary-entry-google"

     useEffect(() => {
        document.title = "Diario alimenticio - EyesFood";
        setSelectedDate(dayjs())
        if (window.localStorage.g_auth) {
            api.get(`${diariesURL}/${window.localStorage.g_auth}`, {
                headers: {
                    Authorization: `Bearer ${window.localStorage.token}`
                }
            })
            .then(response => {
                //console.log(response)
                setTaskLists(response.data)
                setLoadingTaskLists(false); // Stop loading once task lists are fetched
            })
            .catch(error => console.log(error));
            setLoadingTaskLists(false); // Stop loading on error as well
        }
        else{
            console.log("not google")
            setGoogleUser(false)
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
                    //console.log(taskDueDate, selectedFormattedDate)
                    return taskDueDate === selectedFormattedDate;
                }
            }
        );
        setFilteredTasks(tasksForDate || []);
    },[tasks])

    const handleTaskList = (id: string) => {
        setLoadingTasks(true); // Start loading when fetching tasks
        api.get(`${entriesURL}/${window.localStorage.g_auth}/${id}`, {
            headers: {
                Authorization: `Bearer ${window.localStorage.token}`
            }
        })
        .then(response => {
            const tasksWithDates = response.data.items.map((task: any) => ({
                ...task,
                notes: task.notes ? task.notes.split('\n') : [],
                due: task.due ? dayjs(task.due).add(1, "day") : null
            }));
            setTasks(tasksWithDates.reverse());
            // setHighlightedDays(getHighlightedDays(tasksWithDates, selectedDate));
            setSelectedTaskList(id)
            setLoadingTasks(false);
    })
        .catch(error => console.log(error));
        setLoadingTasks(false); // Stop loading on error
    }

    const handleCreateTaskList = () => {
        if (!newTaskListTitle) return; // Prevent creating empty lists

        api.post(
            `${diariesURL}/${window.localStorage.g_auth}`,
            {
                title: newTaskListTitle
            },
            {
                headers: {
                    Authorization: `Bearer ${window.localStorage.token}`,
                },
            }
        )
            .then((response) => {
                setTaskLists([...taskLists, response.data]); // Update the task list with the new one
                setNewTaskListTitle(''); // Clear input after creation
                setOpenNewDiaryDialog(false)
            })
            .catch((error) => console.log(error));
    };

    const handleDeleteTaskList = (listId: string) => {
        if (window.confirm('¿Está seguro que desea eliminar este diario?')) {
          api.delete(`${diariesURL}/${window.localStorage.g_auth}`, {
            headers: {
              Authorization: `Bearer ${window.localStorage.token}`
            },
            data: {
                id: listId
            }
          })
            .then(response => {
                //console.log(response)
              // Remove the deleted task list from the local state
              setTaskLists((prevLists:any) => prevLists.filter((list:any) => list.id !== listId));
              setTasks(null)
              //console.log('Task list deleted successfully');
            })
            .catch((error) => console.error('Error deleting task list:', error));
        }
      };

    const handleDateClick = (date: Dayjs) => {
        setSelectedDate(date);
        const tasksForDate = tasks?.filter((task: any) => 
            {   
                if (task.due){
                    const taskDueDate = dayjs(task.due).format("DD/MM/YYYY"); 
                    // Format selected date to yyyy-mm-dd
                    const selectedFormattedDate = dayjs(date).format("DD/MM/YYYY");
                    //console.log(taskDueDate, selectedFormattedDate)
                    return taskDueDate === selectedFormattedDate;
                }
                return false;
            }
        );
        setFilteredTasks(tasksForDate || []);
    };

    const generatePDF = (taskListTitle: string, tasks: any[], userName: string) => {
        const doc = new jsPDF();
      
        doc.text(`Diario alimenticio: ${taskListTitle}`, 10, 10);
        doc.text(`Usuario: ${userName}`, 10, 20);

        const tasksByDay: { [key: string]: Task[] } = tasks.reduce((acc: { [key: string]: Task[] }, task: Task) => {
            const taskDate = dayjs(task.due).format('YYYY-MM-DD');
            if (!acc[taskDate]) {
                acc[taskDate] = [];
            }
            acc[taskDate].push(task);
            return acc;
        }, {});
    
    
        // Sort keys (dates) chronologically
        const sortedDates = Object.keys(tasksByDay).sort((a, b) => dayjs(a).diff(dayjs(b)));
      
        const tableData: any[] = sortedDates.reduce((acc: any[], date: string) => {
            const tasksForDate = tasksByDay[date];
            tasksForDate.forEach(task => {
                acc.push([
                    dayjs(date).format('DD/MM/YYYY'), // Date column
                    task.title, // Entry column (task title)
                    task.notes ? task.notes.join("\n") : 'N/A' // Details column (task notes)
                ]);
            });
            return acc;
        }, []);

        autoTable(doc, {
            head: [['Fecha', 'Registro', 'Detalles']], // Table headers
            body: tableData, // Table body
            startY: 30, // Start position
            styles: {
                cellPadding: 3,
                fontSize: 10,
            },
            headStyles: {
                fillColor: [22, 160, 133], // Header color
            },
            columnStyles: {
                0: { cellWidth: 40 }, // Date column width
                1: { cellWidth: 70 }, // Entry column width
                2: { cellWidth: 70 }, // Details column width
            }
        });

        doc.save(`${taskListTitle}.pdf`);
      };
      
      // Call this function when needed
      const handleDownloadPDF = () => {
        const userName = localStorage.getItem('name');
        const selectedTaskListTitle = taskLists.find((list:any)=> list.id === selectedTaskList)?.title
        generatePDF(selectedTaskListTitle, tasks, userName || 'Desconocido');
      };

    const openAddTaskDialog = () => {
        setIsAddTaskOpen(true);
    };
    
    const closeAddTaskDialog = () => {
        setIsAddTaskOpen(false);
    };

    const openEditTaskDialog = (task:any) => {
        setTaskToEdit(task); 
        setIsEditTaskOpen(true);
    };
    
    const closeEditTaskDialog = () => {
        setIsEditTaskOpen(false);
    };

    const handleMonthChange = (date: Dayjs) => {
        setSelectedDate(date.startOf('month'));
        // Update highlightedDays based on the new month
        // ...
      };

    return ( googleUser? <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
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
                <Grid key={list.id} container alignItems="center" justifyContent="center">
                    <Button variant="contained" onClick={() => handleTaskList(list.id)}
                    sx={{
                        backgroundColor: selectedTaskList === list.id ? 'secondary.main' : 'primary.main',  // Apply background color if selected
                        color: selectedTaskList === list.id ? 'secondary.contrastText' : 'primary.contrastText',  // Apply text color if selected
                    }}>
                        {list.title.replace(" EF", "")}
                    </Button>
                    <IconButton onClick={() => handleDeleteTaskList(list.id)} color="error">
                        <DeleteForeverRoundedIcon></DeleteForeverRoundedIcon>
                    </IconButton>
                </Grid>
            ))
        ) : (
            <Typography>No hay listas disponibles</Typography>  // Handle case where no task lists are found
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '90%' }}>
            
            <Button variant="text" onClick={()=>setOpenNewDiaryDialog(true)} sx={{width: "auto"}}>
                Crear diario
            </Button>
            <Dialog open={openNewDiarydialog} onClose={()=>setOpenNewDiaryDialog(false)}>
                <DialogTitle>Nuevo diario alimenticio</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Nombre"
                        inputProps = {{maxLength: 100}}
                        value={newTaskListTitle}
                        onChange={(e) => setNewTaskListTitle(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={()=>setOpenNewDiaryDialog(false)} color="secondary">Salir</Button>
                    <Button onClick={handleCreateTaskList} disabled={newTaskListTitle===""} color="primary" variant="contained">Agregar diario</Button>
                </DialogActions>
            </Dialog>
        </Box>

        {tasks && !loadingTasks && (
            <>
            <Button variant="contained" onClick={handleDownloadPDF}>
                Descargar PDF
            </Button>
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
                                
                                <Button
                                    variant="contained"
                                    onClick={() => openEditTaskDialog(task)}
                                    sx={{
                                        padding:0.2, 
                                        color: "warning.main", 
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        height: "100%"
                                    }}
                                >
                                    <EditNoteRoundedIcon sx={{color: 'warning.main', height: "28px", width: "28px" }}/>
                                    <Typography 
                                    variant='subtitle1' 
                                    color="warning.main" 
                                    fontSize={12}
                                    textAlign={"justify"}
                                    sx={{textDecoration: "underline"}}>
                                        Editar
                                    </Typography>
                                </Button>

                                {/* Add Task Dialog */}
                                {isEditTaskOpen && selectedDate && taskToEdit && (
                                    <EditTaskForm setTasks={setTasks} listId={selectedTaskList} selectedDate={selectedDate} onClose={closeEditTaskDialog} task = {taskToEdit}/>
                                )}
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
                <Button
                    variant="contained"
                    onClick={openAddTaskDialog}
                    sx={{ marginTop: '16px' }}
                >
                    Agregar registro en {selectedDate?.format('DD/MM/YYYY')}
                </Button>

                {/* Add Task Dialog */}
                {isAddTaskOpen && selectedDate && (
                    <AddTaskForm setTasks={setTasks} listId={selectedTaskList} selectedDate={selectedDate} onClose={closeAddTaskDialog} />
                )}
            </>
        )}

        {loadingTasks && <CircularProgress />}  {/* Show spinner while tasks are loading */}
    </Grid>
    </LocalizationProvider>
    : <>Funcionalidad para usuarios que inician sesión con Google</>       
    )
}

export default FoodDiary
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const NavigateBack:React.FC<{size?: "small" | "medium" | "large"}> = ({size = "medium"}) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1); // Navigate to the previous page
    };

    return (
        <IconButton
              onClick={handleBack}
              color="inherit"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "none",
              }}
            >
                <ArrowBackIcon fontSize={size}/>
        </IconButton>
    );
};

export default NavigateBack;
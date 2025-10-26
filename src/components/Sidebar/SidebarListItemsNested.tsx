import * as React from "react";
import Box from "@mui/joy/Box";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
import Typography from "@mui/joy/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";

interface TogglerProps {
    defaultExpanded?: boolean;
    children: React.ReactNode;
    renderToggle: (params: {
        open: boolean;
        setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    }) => React.ReactNode;
}

const Toggler = ({
                     defaultExpanded = false,
                     renderToggle,
                     children,
                 }: TogglerProps) => {
    const [open, setOpen] = React.useState(defaultExpanded);
    return (
        <React.Fragment>
            {renderToggle({open, setOpen})}
            <Box
                sx={[
                    {
                        display: 'grid',
                        transition: '0.2s ease',
                        '& > *': {
                            overflow: 'hidden',
                        },
                    },
                    open ? {gridTemplateRows: '1fr'} : {gridTemplateRows: '0fr'},
                ]}
            >
                {children}
            </Box>
        </React.Fragment>
    );
}

interface SidebarListItemsNestedProps {
    defaultExpanded: boolean;
    icon: React.ReactNode;
    name: string;
    children: React.ReactNode;
}

export const SidebarListItemsNested = ({defaultExpanded, icon, name, children}: SidebarListItemsNestedProps) => {
    return (
        <ListItem nested>
            <Toggler
                defaultExpanded={defaultExpanded}
                renderToggle={({open, setOpen}) => (
                    <ListItemButton onClick={() => setOpen(!open)}>
                        {icon}
                        <ListItemContent>
                            <Typography level="title-sm">{name}</Typography>
                        </ListItemContent>
                        <KeyboardArrowDownIcon
                            sx={[
                                open ? {transform: 'rotate(180deg)'} : {transform: 'none'},
                            ]}
                        />
                    </ListItemButton>
                )}
            >
                <List sx={{gap: 0.5}}>
                    {children}
                </List>
            </Toggler>
        </ListItem>
    )
}

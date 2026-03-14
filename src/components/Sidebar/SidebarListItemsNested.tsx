import * as React from "react";
import { ChevronDown } from 'lucide-react';
import {
    List,
    ListItem,
    Typography,
    ListItemButton,
    ListItemContent,
    Box
} from "@mui/joy";

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

const SidebarListItemsNested = ({defaultExpanded, icon, name, children}: SidebarListItemsNestedProps) => {
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
                        <ChevronDown
                            size={16}
                            style={{
                                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease'
                            }}
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

export default SidebarListItemsNested;

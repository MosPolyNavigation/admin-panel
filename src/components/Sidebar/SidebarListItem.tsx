import {ListItem, ListItemButton, ListItemContent} from "@mui/joy";
import * as React from "react";

interface SidebarListItemProps {
    selected: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const SidebarListItem = ({children, icon, ...buttonProps}: SidebarListItemProps) => {
    return (
        <ListItem>
            <ListItemButton {...buttonProps}>
                {icon}
                <ListItemContent>
                    {children}
                </ListItemContent>
            </ListItemButton>
        </ListItem>
    )
}

export default SidebarListItem;
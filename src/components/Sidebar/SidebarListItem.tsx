import ListItem from "@mui/joy/ListItem";
import ListItemButton from "@mui/joy/ListItemButton";
import ListItemContent from "@mui/joy/ListItemContent";
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
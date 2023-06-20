import { Divider, ListItemIcon, Menu, MenuItem } from '@mui/material';
import Image from 'next/image';
import EditIcon from '@/assets/icons/edit.svg';
import DeleteIcon from '@/assets/icons/delete.svg';

interface MenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  handleClose: () => void;
  handleEdit?: () => void;
  elementId: string;
  handleDeleteConnection: () => void;
}

export const ActionsMenu: React.FC<MenuProps> = ({
  anchorEl,
  open,
  handleClose,
  handleEdit,
  handleDeleteConnection,
}) => (
  <Menu
    id="basic-menu"
    anchorEl={anchorEl}
    open={open}
    sx={{ marginTop: 2, py: 0 }}
    onClose={handleClose}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    MenuListProps={{
      sx: { p: 0 },
      'aria-labelledby': 'basic-button',
    }}
  >
    <MenuItem sx={{ my: 0 }} onClick={() => handleEdit()}>
      <ListItemIcon style={{ minWidth: 28 }}>
        <Image src={EditIcon} alt="edit icon" />
      </ListItemIcon>
      Edit
    </MenuItem>
    <Divider style={{ margin: 0 }} />
    <MenuItem onClick={() => handleDeleteConnection()}>
      <ListItemIcon style={{ minWidth: 28 }}>
        <Image src={DeleteIcon} alt="delete icon" />
      </ListItemIcon>
      Delete
    </MenuItem>
  </Menu>
);

import { useState } from 'react';
import { Button, Input, Space, Tag, Typography } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useOrderStore } from '../store/useOrderStore';

export default function PeopleManager() {
  const people = useOrderStore((s) => s.people);
  const addPerson = useOrderStore((s) => s.addPerson);
  const renamePerson = useOrderStore((s) => s.renamePerson);
  const removePerson = useOrderStore((s) => s.removePerson);
  const [name, setName] = useState('');

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addPerson(trimmed);
    setName('');
  };

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Space.Compact style={{ width: '100%', maxWidth: 360 }}>
        <Input
          placeholder="Person name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={add}
        />
        <Button type="primary" icon={<UserAddOutlined />} onClick={add}>
          Add
        </Button>
      </Space.Compact>
      <Space size={[4, 8]} wrap>
        {people.map((p) => (
          <Tag
            key={p.id}
            color={p.color}
            closable
            onClose={(e) => {
              e.preventDefault();
              removePerson(p.id);
            }}
            style={{ paddingTop: 2, paddingBottom: 2 }}
          >
            <Typography.Text
              style={{ color: 'inherit' }}
              editable={{
                onChange: (v) => v.trim() && renamePerson(p.id, v.trim()),
                tooltip: 'Rename',
              }}
            >
              {p.name}
            </Typography.Text>
          </Tag>
        ))}
      </Space>
    </Space>
  );
}

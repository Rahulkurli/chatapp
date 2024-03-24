import React, { useEffect, useState } from "react";
import Avatar from "../../assets/Avatar.jpg";
import { AiOutlinePlusSquare } from "react-icons/ai";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateGroup = ({ onGroupCreated, closeModal }) => {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  console.log("users", users);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [selectedMembers, setSelectedMembers] = useState([user.id]);
  console.log("selectedMembers", selectedMembers);
  const navigate = useNavigate();
  const base_url = "http://localhost:8000";

  // show participants
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${base_url}/api/users/${user?.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const resData = await response.json();
        setUsers(resData);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleAddUserToGroup = (receiverId) => {
    // Check if the user is already selected, if not, add them to selectedMembers
    if (!selectedMembers.includes(receiverId)) {
      setSelectedMembers([...selectedMembers, receiverId]);
    }
  };

  const handleRemoveUserFromGroup = (receiverId) => {
    // Remove the user from selectedMembers
    const updatedSelectedMembers = selectedMembers.filter(
      (id) => id !== receiverId
    );
    setSelectedMembers(updatedSelectedMembers);
  };

  const handleGroupNameChange = (event) => {
    setGroupName(event.target.value);
  };

  const groupData = {
    name: groupName,
    admin: user.id,
    members: selectedMembers,
  };
  const createGroup = async () => {
    if (groupName.trim() !== "") {
      try {
        const response = await axios.post(`${base_url}/api/groups`, groupData);
        if (response.status === 201) {
          // Group created successfully
          const newGroup = response.data; // Assuming the response contains the new group object
          onGroupCreated(newGroup); // Call the parent's function to update the list of groups
          console.log("Group created:", newGroup);
          closeModal();
        }
      } catch (error) {
        // Handle any errors here, e.g., show an error message
        console.error("Error creating group:", error);
      }
    }
    setGroupName("");
    setSelectedMembers([]);
    navigate("/");
  };

  return (
    <div>
      <h2 className="text-center text-lg p-4">Create New Group</h2>
      <div className="flex">
        <input
          className="shadow appearance-none border rounded w-full m-1 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={handleGroupNameChange}
        />
        <button
          className="bg-blue-500 text-white rounded-lg p-2 m-1 "
          onClick={createGroup}
        >
          Create
        </button>
      </div>
      <div>
        <div className="py-2">Add Participants</div>
        <div className="px-1 py-1">
          {users.length > 0 ? (
            users.map(({ user, userId, img = Avatar, index }) => {
              const isUserSelected = selectedMembers.includes(user.receiverId);

              return (
                <div
                  className="flex items-center justify-between py-1 border-b border-b-gray-300"
                  key={index}
                >
                  <div
                    className="inline-flex cursor-pointer items-center "
                    onClick={() => fetchMessages("new", user)}
                  >
                    <div className="rounded-full border p-0.5">
                      <img src={img} className="rounded-full h-11 w-11" />
                    </div>
                    <div className="ml-4">
                      <h3 className="">{user.fullName} </h3>
                      <p className="text-sm font-light text-gray-600">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="">
                    {isUserSelected ? (
                      <RxCross2
                        className="h-6 w-6 text-red-500"
                        onClick={() =>
                          handleRemoveUserFromGroup(user.receiverId)
                        }
                      />
                    ) : (
                      <AiOutlinePlusSquare
                        className="h-6 w-6 text-gray-500"
                        onClick={() => handleAddUserToGroup(user.receiverId)}
                      />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-24">
              No Conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;

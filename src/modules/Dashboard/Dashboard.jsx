import React, { Fragment, useEffect, useRef, useState } from "react";
import Avatar from "../../assets/Avatar.jpg";
import {
  MdAddIcCall,
  MdOutlinePersonAddAlt,
  MdOutlinePersonRemove,
  MdVideoCall,
} from "react-icons/md";
import Input from "../../components/input/input";
import { TbSend } from "react-icons/tb";
import { BsEmojiSmile, BsPersonPlus, BsPlusCircle } from "react-icons/bs";
import { io } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { RxCross2, RxCrossCircled } from "react-icons/rx";
import { PiDotsThreeOutlineVertical } from "react-icons/pi";
import Modal from "react-modal";

import "../../style.css";
import { Menu, Transition } from "@headlessui/react";
import EmojiPicker from "emoji-picker-react";
import { Link } from "react-router-dom";
import Broadcast from "./Broadcast";
import Groups from "./Groups";
import CreateGroup from "./CreateGroup";
import { BiGroup } from "react-icons/bi";
import { FiSettings } from "react-icons/fi";
import { AiOutlinePlusSquare } from "react-icons/ai";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

const Dashboard = () => {
  const [conversations, setConversations] = useState([]);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user:detail"))
  );
  const [messages, setMessages] = useState({});
  const [inputValue, setInputValue] = useState("");
  const [groupInputValue, setGroupInputValue] = useState("");
  console.log("inputValue", inputValue);
  const [users, setUsers] = useState([]);
  console.log("users", users);
  const [socket, setSocket] = useState(null);
  const messageRef = useRef(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  console.log("selectedMedia", selectedMedia);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [groupEmojiPickerVisible, setGroupEmojiPickerVisible] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  console.log("typingUsers", typingUsers);
  const [uniqueMessages, setUniqueMessages] = useState(new Set());
  const [broadcastMessages, setBroadcastMessages] = useState([]);
  console.log("broadcastMessages", broadcastMessages);
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [groups, setGroups] = useState([]);
  const [groupModal, setGroupModal] = React.useState(false);
  const [groupMessages, setGroupMessages] = useState({});
  console.log("group messages", groupMessages);
  const [groupModalAddUser, setGroupModalAddUser] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  console.log("selected member", selectedMembers);
  const [groupMembers, setGroupMembers] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  console.log("selected group", selectedGroup);
  console.log(groups.map((group) => group._id === selectedGroup));

  const base_url = "http://localhost:8000";

  function openModal() {
    axios
      .get(`${base_url}/api/broadcast`)
      .then((response) => {
        setBroadcastMessages(response.data); // Assuming the response contains an array of broadcast messages
      })
      .catch((error) => {
        console.error("Error fetching broadcast messages:", error);
      });
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setGroupModal(false);
    setGroupModalAddUser(false);
  }

  const sendBroadcastMessage = (message) => {
    // Emit an object with sender name and message content
    const data = {
      senderName: user.fullName,
      message: message,
    };

    // Send the broadcast message to the server
    axios
      .post(`${base_url}/api/broadcast`, data)
      .then((response) => {
        console.log("Broadcast message sent and stored:", response.data);
      })
      .catch((error) => {
        console.error("Error sending broadcast message:", error);
      });
  };

  useEffect(() => {
    socket?.on("broadcastMessage", (data) => {
      console.log("Received broadcast message:", data);
      const { senderName, message } = data;
      setBroadcastMessages((prevMessages) => [
        ...prevMessages,
        `${senderName}: ${message}`,
      ]);
    });
  }, [socket]);

  useEffect(() => {
    setSocket(io(base_url));
  }, []);

  const handleTyping = (text) => {
    setInputValue(text);
    if (text) {
      socket?.emit(
        "typing",
        user?.id,
        messages?.conversationId,
        messages?.receiver?.receiverId
      );
    } else {
      socket?.emit(
        "stopTyping",
        user?.id,
        messages?.conversationId,
        messages?.receiver?.receiverId
      );
    }
  };

  useEffect(() => {
    socket?.emit("addUser", user?.id);
    socket?.on("getUsers", (users) => {});
    socket?.on("getMessage", (data) => {
      if (data.isImage) {
        const { conversationId, senderId, message } = data;
      } else {
        const messageKey = JSON.stringify({
          user: data.user,
          message: data.message,
        });

        if (!uniqueMessages.has(messageKey)) {
          // Add the message to the set of unique messages and update state
          setUniqueMessages((prev) => new Set([...prev, messageKey]));

          setMessages((prev) => ({
            ...prev,
            messages: [
              ...prev?.messages,
              { user: data.user, message: data.message },
            ],
          }));
        }
      }
    });

    socket?.on("sendMessage", (data) => {
      const { conversationId, senderId, message } = data;
    });

    socket?.on("connect", () => {
      console.log("Socket connected");
    });

    socket?.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socket?.on("userTyping", ({ userId, conversationId, receiverId }) => {
      if (
        conversationId === messages?.conversationId &&
        receiverId === user?.id
      ) {
        setTypingUsers((prevTypingUsers) => ({
          ...prevTypingUsers,
          [userId]: true,
        }));
      }
    });

    socket?.on(
      "userStoppedTyping",
      ({ userId, conversationId, receiverId }) => {
        if (
          conversationId === messages?.conversationId &&
          receiverId === user?.id
        ) {
          setTypingUsers((prevTypingUsers) => {
            const updatedTypingUsers = { ...prevTypingUsers };
            delete updatedTypingUsers[userId];
            return updatedTypingUsers;
          });
        }
      }
    );

    // Add a listener for group messages
    socket?.on("getGroupMessage", (data) => {
      setGroupMessages((prevGroupMessages) => [...prevGroupMessages, data]);
    });

    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  // this will scroll the messages to the downward/last message
  useEffect(() => {
    messageRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.messages]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user:detail"));
    const fetchConversations = async () => {
      const response = await fetch(
        `${base_url}/api/conversation/${
          loggedInUser?.receiverId ||
          loggedInUser?.senderIdId ||
          loggedInUser?.id
        }`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const resData = await response.json();
      setConversations(resData);
    };
    fetchConversations();
  }, []);

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

  const fetchMessages = async (conversationId, receiver) => {
    const response = await fetch(
      `${base_url}/api/message/${conversationId}?senderId=${user?.id}&&receiverId=${receiver?.receiverId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    setSelectedGroup("");
    const resData = await response.json();
    setMessages({ messages: resData, receiver, conversationId });
  };

  const [mediaName, setMediaName] = useState("");

  const handleMediaSelection = (e) => {
    const file = e.target.files[0];
    setSelectedMedia(file);
    if (file) {
      setMediaName(file.name);
    } else {
      setMediaName("");
    }
  };

  const removeSelectedImage = () => {
    setSelectedMedia(null);
    setMediaName("");
    setInputValue("");
  };

  // When the user selects an image or video and clicks the send button
  const sendMedia = () => {
    if (selectedMedia) {
      const formData = new FormData();
      formData.append("media", selectedMedia);

      axios
        .post(`${base_url}/api/upload`, formData)
        .then((response) => {
          const mediaUrl = response.data.mediaUrl;
          setInputValue(mediaUrl);
          setSelectedMedia(null);
          setMediaName("");
        })
        .catch((error) => {
          console.log("Error uploading media:", error);
        });
    }
  };

  const handleEmojiClick = (event, emojiObject) => {
    const emoji = event.emoji;
    setInputValue((prevInputValue) => prevInputValue + emoji);
  };

  const sendMessage = async () => {
    if (!inputValue && !selectedMedia) {
      return;
    }

    socket?.emit("sendMessage", {
      conversationId: messages?.conversationId,
      senderId: user?.id,
      message: inputValue,
      receiverId: messages?.receiver?.receiverId,
    });
    try {
      await fetch(`${base_url}/api/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: messages?.conversationId,
          senderId: user?.id,
          message: inputValue,
          receiverId: messages?.receiver?.receiverId,
        }),
      });
      setInputValue("");
      setEmojiPickerVisible(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // groups info starts here =======================================================================================================

  // Get groups
  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await axios.get(`${base_url}/api/groups/${user.id}`);
        setGroups(response.data);
      } catch (err) {
        console.log("Error", err);
      }
    };
    fetchGroup();
  }, []);

  function openGroupModal() {
    setGroupModal(true);
  }

  // find selected group and members
  const CurrentGroup = groups
    .filter((item) => item._id === selectedGroup)
    .map((item) => item.name);
  const CurrentGroupMembers = groups
    .filter((item) => item._id === selectedGroup)
    .map((item) => item.members.map((elem) => elem._id));
  console.log("currentGroupMembers", CurrentGroupMembers);

  // fetch Group Messages
  const fetchGroupMessages = async (groupId) => {
    try {
      const response = await axios.get(
        `${base_url}/api/groups/${groupId}/GroupMessage`
      );
      setSelectedGroup(groupId);
      setMessages("");
      setGroupMessages(response.data);
    } catch (err) {
      console.log("Error", err);
    }
  };

  // select emoji
  const handleGroupEmojiClick = (event, emojiObject) => {
    const emoji = event.emoji;
    setGroupInputValue((prevInputValue) => prevInputValue + emoji);
  };

  // send group message
  const sendGroupMessage = async (groupId) => {
    if (!groupInputValue) return;
    // Emit a group message event to the server
    socket?.emit("sendGroupMessage", {
      groupId,
      sender: user.id,
      text: groupInputValue,
    });
    console.log(groupInputValue);
    axios.post(`${base_url}/api/groups/${groupId}/GroupMessage`, {
      sender: user.id,
      text: groupInputValue,
    });
    setGroupInputValue("");
    setGroupEmojiPickerVisible(false);
  };

  // add new group/made for get rid of refresh page
  const addNewGroup = (newGroup) => {
    // Update the groups state with the newly created group
    setGroups((prevGroups) => [...prevGroups, newGroup]);
  };

  // Function to add a user to the group
  const handleAddUserToGroup = (receiverId) => {
    // Check if the user is not already part of the group
    if (!groupMembers.includes(receiverId)) {
      // Add them to the selected members
      setSelectedMembers([...selectedMembers, receiverId]);
    }
  };

  const handleRemoveSelected = (receiverId) => {
    // Remove the user from selectedMembers
    const updatedSelectedMembers = selectedMembers.filter(
      (id) => id !== receiverId
    );
    setSelectedMembers(updatedSelectedMembers);
  };

  const addUserInGroup = (groupId) => {
    axios.post(`${base_url}/api/groups/${groupId}/members`, selectedMembers);
    setSelectedMembers("");
  };

  // remove users from existing group
  const removeUserGroup = async (groupId) => {
    console.log("//////", groupId);
  };
  // axios.post(`${base_url}/api/groups/${groupId}/members`, selectedMembers);

  return (
    <div className="w-screen flex">
      <div className="w-[25%] hidden sm:inline-block h-screen bg-blue-50 overflow-y-scroll">
        <div className="flex items-center justify-between py-6 px-8">
          <div className="rounded-full border border-blue-300 p-0.5">
            <img src={Avatar} className="rounded-full h-16 w-16" />
          </div>
          <div className="-ml-6">
            <h3 className="text-lg">{user?.fullName}</h3>
            <p className=" font-light">My Account</p>
          </div>
          <div className="cursor-pointer">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                <PiDotsThreeOutlineVertical />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-in-out duration-500"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        className={classNames(
                          active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700",
                          "block px-4 py-2 text-sm"
                        )}
                      >
                        <div onClick={openModal}>Broadcast</div>
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        className={classNames(
                          active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700",
                          "block px-4 py-2 text-sm"
                        )}
                      >
                        <div onClick={openGroupModal}>New Group</div>
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        className={classNames(
                          active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700",
                          "block px-4 py-2 text-sm"
                        )}
                      >
                        <div>Log out</div>
                      </a>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
        <hr />
        <div className="mx-8 mt-8">
          <div>Messages</div>
          <Groups groups={groups} fetchGroupMessages={fetchGroupMessages} />
          <div>
            {conversations?.length > 0 ? (
              conversations?.map(({ user, conversationId, img = Avatar }) => {
                return (
                  <div
                    className="flex items-center py-4 border-b border-b-gray-300"
                    key={uuidv4()}
                  >
                    <div
                      className="inline-flex cursor-pointer items-center"
                      onClick={() => fetchMessages(conversationId, user)}
                    >
                      <div className="rounded-full border p-0.5">
                        <img src={img} className="rounded-full h-14 w-14" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg">{user.fullName} </h3>
                        <p className="text-sm font-light text-gray-600">
                          {user.email}
                        </p>
                      </div>
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
      {/* Middle part  */}
      <div className="w-full sm:w-[50%] h-screen bg-white flex flex-col items-center px-3">
        {/* Chat person navbar  */}
        <div className="flex flex-col items-center justify-between w-full gap-2 mt-10">
          {/* Conversation  */}
          <div className="sm:hidden flex w-full justify-between items-center">
            {/* <AiOutlineBars /> */}
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  chats
                </Menu.Button>
              </div>

              <Transition
                as={Fragment}
                enter="transition ease-in-out duration-500"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="">
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700",
                            "block text-sm"
                          )}
                        >
                          <div className="w-full h-screen bg-blue-50 overflow-y-scroll">
                            <div className="flex items-center py-4 px-4">
                              <div className="rounded-full border border-blue-300 p-0.5">
                                <img
                                  src={Avatar}
                                  className="rounded-full h-12 w-12"
                                />
                              </div>
                              <div className="ml-8">
                                <h3 className="text-lg">{user?.fullName}</h3>
                                <p className=" font-light">My Account</p>
                              </div>
                            </div>
                            <hr />
                            <div className="mx-2 mt-4">
                              <div>Messages</div>
                              <div>
                                {conversations?.length > 0 ? (
                                  conversations?.map(
                                    ({
                                      user,
                                      conversationId,
                                      img = Avatar,
                                    }) => {
                                      return (
                                        <div
                                          className="flex items-center py-4 border-b border-b-gray-300"
                                          key={uuidv4()}
                                        >
                                          <div
                                            className="inline-flex cursor-pointer items-center"
                                            onClick={() =>
                                              fetchMessages(
                                                conversationId,
                                                user
                                              )
                                            }
                                          >
                                            <div className="rounded-full border p-0.5">
                                              <img
                                                src={img}
                                                className="rounded-full h-10 w-10"
                                              />
                                            </div>
                                            <div className="ml-4">
                                              <h3 className="text-lg truncate">
                                                {user.fullName}
                                              </h3>
                                              <p className="text-sm font-light text-gray-600 truncate">
                                                {user.email}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )
                                ) : (
                                  <div className="text-center text-lg font-semibold mt-24">
                                    No Conversation
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </a>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            <div className="sm:hidden">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    People
                  </Menu.Button>
                </div>

                <Transition
                  as={Fragment}
                  enter="transition ease-in-out duration-500"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="">
                      <Menu.Item>
                        {({ active }) => (
                          <a
                            href="#"
                            className={classNames(
                              active
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-700",
                              "block text-sm"
                            )}
                          >
                            <div className="w-full p-2 bg-blue-50 overflow-y-scroll">
                              <div className="text-blue-500">People</div>
                              <div>
                                {users.length > 0 ? (
                                  users.map(
                                    ({ user, userId, img = Avatar }) => {
                                      return (
                                        <div
                                          className="flex items-center py-4 border-b border-b-gray-300"
                                          key={userId}
                                        >
                                          <div
                                            className="inline-flex cursor-pointer items-center"
                                            onClick={() =>
                                              fetchMessages("new", user)
                                            }
                                          >
                                            <div className="rounded-full border p-0.5">
                                              <img
                                                src={img}
                                                className="rounded-full h-10 w-10"
                                              />
                                            </div>
                                            <div className="ml-2">
                                              <h3 className="truncate">
                                                {user.fullName}
                                              </h3>
                                              <p className="text-sm font-light text-gray-600 truncate">
                                                {user.email}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )
                                ) : (
                                  <div className="text-center text-lg font-semibold mt-24">
                                    No Users
                                  </div>
                                )}
                              </div>
                            </div>
                          </a>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
          {messages?.receiver?.fullName && (
            <div className="w-full sm:mx-10 bg-blue-50 h-14 sm:h-[80px]  rounded-full flex items-center px-3 sm:px-10 py-2">
              <div>
                <img
                  src={Avatar}
                  className="w-10 h-10 sm:w-14 sm:h-14 border rounded-full cursor-pointer"
                />
              </div>
              <div className="ml-6 mr-auto">
                <h3 className="text-sm sm:text-lg">
                  {messages?.receiver?.fullName}
                </h3>
                <p className="text-[11px] sm:text-sm font-light text-gray-600">
                  {messages?.receiver?.email}
                </p>
                <p className="text-[12px] text-gray-400">
                  {Object.keys(typingUsers).map(
                    (userId) =>
                      userId !== user.id && (
                        <p key={userId}>
                          Typing<span className="animate-pulse">...</span>
                        </p>
                      )
                  )}
                </p>
              </div>
              <div className="cursor-pointer flex gap-3 text-gray-500">
                <MdAddIcCall className="h-6 w-6" />
                <MdVideoCall className="h-6 w-6" />
              </div>
            </div>
          )}
          {CurrentGroup?.length > 0 && (
            <div className="w-full sm:mx-10 bg-blue-50 h-14 sm:h-[80px]  rounded-full flex items-center px-3 sm:px-10 py-2">
              <BiGroup className="h-10 w-10 text-gray-400" />
              <div className="ml-6 mr-auto text-sm sm:text-lg w-full flex justify-between items-center">
                <div>{CurrentGroup && CurrentGroup}</div>
                <div className="text-sm cursor-pointer">
                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md  px-3 py-2 text-sm font-semibold text-gray-900 ">
                      <FiSettings className="h-6 w-6" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-in-out duration-500"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-0 w-56 p-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="px-4 space-y-2">
                          <Menu.Item>
                            <div
                              className="flex items-center gap-2 hover:text-blue-500 "
                              onClick={() => setGroupModalAddUser(true)}
                            >
                              <MdOutlinePersonAddAlt className="h-5 w-5" />
                              Add User
                            </div>
                          </Menu.Item>
                          <Menu.Item>
                            <div
                              className="flex items-center gap-2 hover:text-blue-500 "
                              onClick={() => removeUserGroup(selectedGroup)}
                            >
                              <MdOutlinePersonRemove className="h-5 w-5" />
                              Remove User
                            </div>
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Chat  */}
        <div className="h-[75%] my-4 w-full bg-gray-50 overflow-y-scroll shadow-sm rounded">
          <div className="px-3 py-5 sm:p-10" key={uuidv4()}>
            {messages?.messages?.length > 0 ? (
              messages.messages.map(({ index, message, user: { id } = {} }) => {
                return (
                  <div key={index}>
                    <div
                      className={`max-w-[45%] rounded-b-xl   mb-2.5 ${
                        id === user?.id
                          ? "bg-purple-500 rounded-tl-xl ml-auto text-white"
                          : "bg-[#eeeeee] rounded-tr-xl"
                      }  `}
                    >
                      {message.includes("uploads") ? (
                        message.endsWith(".mp4") || message.endsWith(".avi") ? (
                          <video controls width="300" height="auto">
                            <source
                              src={`${base_url}${message}`}
                              type="video/mp4"
                            />
                            <source
                              src={`${base_url}${message}`}
                              type="video/avi"
                            />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={`${base_url}${message}`}
                            alt="media"
                            style={{ maxWidth: "100%" }}
                          />
                        )
                      ) : (
                        <div className="py-0.5 sm:p-2 px-4">{message}</div>
                      )}
                    </div>
                    <div ref={messageRef}></div>
                  </div>
                );
              })
            ) : groupMessages?.length > 0 ? (
              <div>
                {groupMessages?.map((item, index) => {
                  return (
                    <div key={index}>
                      <div
                        className={`max-w-[45%] rounded-b-xl   mb-2.5 ${
                          item.sender === user?.id
                            ? "bg-purple-500 rounded-tl-xl ml-auto text-white"
                            : "bg-[#eeeeee] rounded-tr-xl"
                        }  `}
                      >
                        <div className="py-0.5 sm:p-2 px-4">{item.text}</div>
                      </div>
                      <div></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No Conversation
              </div>
            )}
          </div>
        </div>
        {messages?.receiver?.fullName && (
          <div className="p-2 sm:p-8 w-full flex items-center gap-3 ">
            <div className="relative">
              <button
                className="text-blue-500 flex items-center"
                onClick={() => setEmojiPickerVisible(!emojiPickerVisible)}
              >
                <BsEmojiSmile className="h-6 w-6" />
              </button>
              <span className="absolute bottom-8 left-8">
                {emojiPickerVisible && (
                  <EmojiPicker
                    height={400}
                    width={300}
                    onEmojiClick={handleEmojiClick}
                  />
                )}
              </span>
            </div>
            <textarea
              rows="1"
              placeholder="Type a message..."
              value={inputValue + (mediaName ? " - " + mediaName : "")}
              onChange={
                ((e) => setInputValue(e.target.value),
                (e) => handleTyping(e.target.value))
              }
              className="w-full sm:p-3 border-0 shadow rounded-lg bg-blue-50 focus:ring-0 outline-none"
            ></textarea>
            {selectedMedia && (
              <div>
                <button className="text-red-500" onClick={removeSelectedImage}>
                  <RxCrossCircled className="h-5 w-5" />
                </button>
              </div>
            )}
            <label className="bg-blue-50 p-3 cursor-pointer rounded-full">
              <input
                type="file"
                name="media"
                accept=".jpg, .jpeg, .png, .gif, .mp4, .avi"
                onChange={handleMediaSelection}
                className="hidden"
              />
              <BsPlusCircle
                className="h-5 w-5 text-gray-600"
                onClick={sendMedia()}
              />
            </label>
            <div
              className={`bg-blue-50 p-3 cursor-pointer rounded-full flex items-center justify-center ${
                !inputValue && !selectedMedia && "pointer-events-none"
              } `}
              onClick={() => {
                sendMessage();
              }}
            >
              <TbSend className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        )}
        {CurrentGroup?.length > 0 && (
          <div className="p-2 sm:p-8 w-full flex items-center gap-3 ">
            <div className="relative">
              <button
                className="text-blue-500 flex items-center"
                onClick={() =>
                  setGroupEmojiPickerVisible(!groupEmojiPickerVisible)
                }
              >
                <BsEmojiSmile className="h-6 w-6" />
              </button>
              <span className="absolute bottom-8 left-8">
                {groupEmojiPickerVisible && (
                  <EmojiPicker
                    height={400}
                    width={300}
                    onEmojiClick={handleGroupEmojiClick}
                  />
                )}
              </span>
            </div>
            <textarea
              rows="1"
              placeholder="Type a group message..."
              value={groupInputValue}
              onChange={(e) => setGroupInputValue(e.target.value)}
              className="w-full sm:p-3 border-0 shadow rounded-lg bg-blue-50 focus:ring-0 outline-none"
            ></textarea>
            <div
              className={`bg-blue-50 p-3 cursor-pointer rounded-full flex items-center justify-center ${
                !groupInputValue && "pointer-events-none"
              } `}
              onClick={() => {
                sendGroupMessage(selectedGroup);
              }}
            >
              <TbSend className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        )}
      </div>
      <div className="w-[25%] hidden sm:inline-block h-screen bg-blue-50  overflow-y-scroll">
        <div className="text-blue-500 px-5 pt-16 flex justify-between items-center">
          <div>People</div>
        </div>

        <div className="px-8 py-4">
          {users.length > 0 ? (
            users.map(({ user, userId, img = Avatar }) => {
              return (
                <div
                  className="flex items-center py-4 border-b border-b-gray-300"
                  key={uuidv4()}
                >
                  <div
                    className="inline-flex cursor-pointer items-center"
                    onClick={() => fetchMessages("new", user)}
                  >
                    <div className="rounded-full border p-0.5">
                      <img src={img} className="rounded-full h-14 w-14" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg">{user.fullName} </h3>
                      <p className="text-sm font-light text-gray-600">
                        {user.email}
                      </p>
                    </div>
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
      {/* Broadcast modal  */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
      >
        <div className="h-[500px] w-[300px] sm:w-[500px]">
          {/* Broadcast message */}
          <div className="text-lg font-semibold text-center my-1">
            Broadcast
          </div>
          <div className="flex flex-col justify-between h-[460px] pt-4">
            <div className="h-full overflow-scroll">
              <h2>Broadcast Messages:</h2>
              {broadcastMessages?.messages?.map((item, index) => (
                <p key={index} className="space-x-2">
                  <span>{item.senderName}:</span>
                  <span>{item.message}</span>
                </p>
              ))}
            </div>
            <div className="">
              <Broadcast onSendBroadcast={sendBroadcastMessage} />
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={groupModal}
        onRequestClose={closeModal}
        style={customStyles}
      >
        <CreateGroup onGroupCreated={addNewGroup} closeModal={closeModal} />
      </Modal>
      <Modal
        isOpen={groupModalAddUser}
        onRequestClose={closeModal}
        style={customStyles}
      >
        <div
          className="flex justify-end cursor-pointer text-red-500"
          onClick={closeModal}
        >
          <RxCross2 />
        </div>
        <div className="cursor-pointer flex justify-between items-center py-3">
          <div className="py-2 text-left">Add Participants</div>
          <div>
            <span
              className="p-0.5 px-4 bg-blue-500 hover:bg-blue-600 rounded text-white"
              onClick={() => addUserInGroup(selectedGroup)}
            >
              Save
            </span>
          </div>
        </div>
        <div>
          {users.length > 0 ? (
            users.map(({ user, userId, img = Avatar, index }) => {
              const isUserSelected = selectedMembers?.includes(user.receiverId);
              const isUserAlreadyAdded = CurrentGroupMembers[0]?.includes(
                user.receiverId
              );
              console.log("isUserAlreadyAdded", isUserAlreadyAdded);
              return (
                <div
                  className="flex items-center justify-between py-1 px-2 border-b border-b-gray-300"
                  key={index}
                >
                  <div className="inline-flex cursor-pointer items-center ">
                    <div className="rounded-full border p-0.5">
                      <img src={img} className="rounded-full h-11 w-11" />
                    </div>
                    {isUserAlreadyAdded ? (
                      <div className="ml-4">
                        <h3 className="text-gray-400">{user.fullName} </h3>
                        <p className="text-sm font-light text-gray-300">
                          {user.email}
                        </p>
                      </div>
                    ) : (
                      <div className="ml-4">
                        <h3 className="">{user.fullName} </h3>
                        <p className="text-sm font-light text-gray-600">
                          {user.email}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="ml-6 cursor-pointer">
                    {isUserSelected
                      ? !isUserAlreadyAdded && (
                          <RxCross2
                            className="h-6 w-6 text-red-500"
                            onClick={() =>
                              handleRemoveSelected(user.receiverId)
                            }
                          />
                        )
                      : !isUserAlreadyAdded && (
                          <AiOutlinePlusSquare
                            className="h-6 w-6 text-gray-500"
                            onClick={() =>
                              handleAddUserToGroup(user.receiverId)
                            }
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
      </Modal>
    </div>
  );
};

export default Dashboard;

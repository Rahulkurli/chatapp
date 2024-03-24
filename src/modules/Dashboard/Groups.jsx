import React from "react";
import { BiGroup } from "react-icons/bi";

const Groups = ({ groups, fetchGroupMessages }) => {
  console.log("groups", groups);

  const handleGroupClick = (groupId) => {
    fetchGroupMessages(groupId);
  };
  return (
    <div>
      {groups?.map((group) => (
        <div key={group?._id} onClick={() => handleGroupClick(group._id)}>
          <div className="flex items-center py-4 border-b border-b-gray-300">
            <div className="inline-flex cursor-pointer items-center">
              <div className="rounded-full border p-2">
                <BiGroup className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg">{group?.name} </h3>
                <p className="text-sm font-light text-gray-600 truncate">
                  {/* Map over group.members and display their first names */}
                  {group?.members.map((item) => (
                    <span key={item?._id}>
                      {item?.fullName?.split(" ")[0]},{" "}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Groups;

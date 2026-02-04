import GroupAudioCall from "../../../components/calls/GroupAudioCall";
import GroupVideoCall from "../../../components/calls/GroupVideoCall";

const GroupCalling = ({ roomId, type }) => {
  return type === "video" ? (
    <GroupVideoCall roomId={roomId} />
  ) : (
    <GroupAudioCall roomId={roomId} />
  );
};

export default GroupCalling;

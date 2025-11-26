import { Text, View, TextInput, Image } from "react-native";
import { moderateScale, scale, verticalScale } from "../../util/scaling";
import { Ionicons } from "@expo/vector-icons";


interface TextInputProps {
    header : string,
    icon : keyof typeof Ionicons.glyphMap,
    placeholder : string
}

export default function CustomTextInput({header, icon, placeholder}: TextInputProps) {
  return (
    <View >
      <Text
        style={{
          fontSize: moderateScale(16),
          fontWeight: "500",
          lineHeight: 16,
         
        }}
      >
        {header}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#E2D3B5",
          height: verticalScale(52),
          borderRadius: moderateScale(8),
          paddingHorizontal: scale(14),
           marginVertical: verticalScale(12),
           backgroundColor : '#FFFFFF1A'
        }}
      >
        <Ionicons
          name={icon}
          size={moderateScale(24)}
          color="#8D8D8D"
          style={{ marginRight: scale(8) }}
        />
        <TextInput
          style={{
            flex: 1,
            fontSize: moderateScale(16),
            fontWeight: "500",
            color: "#000",
          }}
          placeholder={placeholder}
          placeholderTextColor="#00000080"
        />
      </View>
    </View>
  );
}

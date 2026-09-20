package com.tuge.domain.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.tuge.domain.entity.ChatMessage;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ChatMessageMapper extends BaseMapper<ChatMessage> { }

using AutoMapper;
using Throneteki.Lobby.Models;

namespace Throneteki.Lobby.Commands;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<NewGameRequest, NewGameCommand>();
    }
}